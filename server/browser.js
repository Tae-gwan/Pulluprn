const { chromium } = require('playwright');
const { Server } = require('socket.io');

const io = new Server(3003, {
    path: '/browser/socket.io',
    cors: {
        origin: "*", // 실운영 시 클라이언트 도메인으로 제한 필요
        methods: ["GET", "POST"]
    }
});

let browser;
// Room 별로 Context와 Page를 관리
const rooms = new Map(); // roomName -> { context, page, intervalId, lastImage }

async function initBrowser() {
    browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--window-size=1280,720',
        ]
    });
    console.log("Playwright Browser Launched");
}

initBrowser();

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join_browser', async ({ roomName }) => {
        socket.join(roomName);
        // 소켓에 방 이름 저장 (disconnect 시 정리용)
        socket.data.roomName = roomName;
        console.log(`Socket ${socket.id} joined browser room ${roomName}`);

        if (!rooms.has(roomName)) {
            await createRoomSession(roomName);
        }

        // 이미 방이 있으면 현재 상태(마지막 스크린샷) 전송
        const session = rooms.get(roomName);
        if (session && session.lastImage) {
            socket.emit('frame', session.lastImage);
        }
    });

    // 브라우저 이벤트 처리 (Click, Scroll, Key, Navigate)
    socket.on('control_event', async (data) => {
        // data: { roomName, type, ...payload }
        const { roomName, type } = data;
        const session = rooms.get(roomName);
        if (!session || !session.page) return;

        try {
            const page = session.page;

            switch (type) {
                case 'navigate':
                    await page.goto(data.url, { waitUntil: 'domcontentloaded' }).catch(e => console.error(e));
                    break;

                case 'click':
                    await page.mouse.click(data.x, data.y);
                    break;

                case 'scroll':
                    await page.mouse.wheel(data.deltaX, data.deltaY);
                    break;

                case 'type':
                    await page.keyboard.type(data.text);
                    break;

                case 'key_press':
                    await page.keyboard.press(data.key);
                    break;

                case 'back':
                    await page.goBack().catch(() => { });
                    break;

                case 'forward':
                    await page.goForward().catch(() => { });
                    break;

                case 'reload':
                    await page.reload().catch(() => { });
                    break;
            }
            // 이벤트 처리 후 즉시 스크린샷 캡처 (반응성 향상)
            await captureAndBroadcast(roomName);

        } catch (error) {
            console.error(`Error handling event ${type} in room ${roomName}:`, error);
        }
    });

    // 브라우저 명시적 종료 (X 닫기 버튼)
    socket.on('close_browser', async ({ roomName }) => {
        console.log(`Browser close requested for room: ${roomName}`);
        await cleanupRoomSession(roomName);
    });

    socket.on('disconnect', async () => {
        console.log(`Client disconnected: ${socket.id}`);

        const roomName = socket.data.roomName;
        if (!roomName) return;

        // 방에 남은 인원 확인
        const room = io.sockets.adapter.rooms.get(roomName);
        if (!room || room.size === 0) {
            // 방이 비었으면 브라우저 세션 정리
            await cleanupRoomSession(roomName);
        }
    });
});

async function createRoomSession(roomName) {
    if (!browser) await initBrowser();

    try {
        console.log(`Creating new browser session for room: ${roomName}`);
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            deviceScaleFactor: 1,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            locale: 'ko-KR',
            timezoneId: 'Asia/Seoul',
        });

        // navigator.webdriver 제거 (봇 감지 우회)
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            // Chrome runtime 위장
            window.chrome = { runtime: {} };
        });

        const page = await context.newPage();

        // 초기 페이지
        await page.goto('https://www.google.com');

        // 세션 정보 저장
        const session = {
            context,
            page,
            intervalId: null,
            lastImage: null,
            isCapturing: false
        };
        rooms.set(roomName, session);

        // 주기적 스크린샷 캡처 (Streaming) - 10fps ~ 15fps
        session.intervalId = setInterval(() => {
            captureAndBroadcast(roomName);
        }, 100); // 100ms마다 캡처

    } catch (error) {
        console.error(`Failed to create room session for ${roomName}:`, error);
    }
}

async function captureAndBroadcast(roomName) {
    const session = rooms.get(roomName);
    if (!session || !session.page || session.isCapturing) return;

    session.isCapturing = true;
    try {
        const buffer = await session.page.screenshot({
            type: 'jpeg',
            quality: 70, // 성능을 위해 JPEG 품질 70
            fullPage: false
        });
        const imageBase64 = buffer.toString('base64');
        session.lastImage = imageBase64;

        // 해당 룸의 모든 클라이언트에게 전송
        io.to(roomName).emit('frame', imageBase64);
    } catch (error) {
        // 페이지가 닫혔거나 에러 발생 시
        // console.error(`Capture error in ${roomName}:`, error.message);
    } finally {
        session.isCapturing = false;
    }
}

// 방 세션 정리 (모든 사용자 이탈 시 호출)
async function cleanupRoomSession(roomName) {
    const session = rooms.get(roomName);
    if (!session) return;

    console.log(`🧹 Cleaning up browser session for room: ${roomName}`);

    // 1. 스크린샷 인터벌 중지
    if (session.intervalId) {
        clearInterval(session.intervalId);
        session.intervalId = null;
    }

    // 2. Playwright 페이지 닫기
    try {
        if (session.page) {
            await session.page.close();
        }
    } catch (e) {
        console.error(`Error closing page for ${roomName}:`, e.message);
    }

    // 3. Playwright 컨텍스트 닫기
    try {
        if (session.context) {
            await session.context.close();
        }
    } catch (e) {
        console.error(`Error closing context for ${roomName}:`, e.message);
    }

    // 4. Map에서 제거
    rooms.delete(roomName);
    console.log(`✅ Browser session for room "${roomName}" fully cleaned up (active rooms: ${rooms.size})`);
}

// 프로세스 종료 시 모든 세션 정리
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down — cleaning up all browser sessions...');
    for (const roomName of rooms.keys()) {
        await cleanupRoomSession(roomName);
    }
    if (browser) await browser.close();
    process.exit();
});

