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

                case 'key_down':
                    await page.keyboard.down(data.key);
                    break;

                case 'key_up':
                    await page.keyboard.up(data.key);
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

    // FPS 변경 요청 처리
    socket.on('change_fps', ({ roomName, fps }) => {
        const session = rooms.get(roomName);
        if (session && [30, 60].includes(fps)) {
            session.fps = fps;
            console.log(`Room ${roomName} FPS changed to ${fps}`);
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

        // 🛑 광고 및 트래커 차단 (성능 최적화)
        // 불필요한 리소스 로딩을 막아 CPU 사용량 30~50% 절감
        await page.route('**/*', (route) => {
            const url = route.request().url();
            const AD_PATTERNS = [
                'doubleclick.net',
                'googleadservices.com',
                'googlesyndication.com',
                'adservice.google.com',
                'facebook.net',
                'facebook.com/tr', // 픽셀
                'analytics',
                'adnxs.com',
                'criteo.com',
                'advertising.com',
                'pubmatic.com',
                'rubiconproject.com',
                'taboola.com',
                'outbrain.com'
            ];

            const isAd = AD_PATTERNS.some(pattern => url.includes(pattern));
            if (isAd) {
                // console.log(`🚫 Blocked ad/tracker: ${url}`);
                return route.abort(); // 요청 차단
            }
            return route.continue(); // 정상 통과
        });

        // 초기 페이지
        await page.goto('https://www.google.com');

        // CDP 세션 생성 (Screencast용)
        const cdpSession = await context.newCDPSession(page);

        // 세션 정보 저장
        const session = {
            context,
            page,
            cdpSession,
            lastImage: null,
            fps: 60, // 기본 FPS
        };
        rooms.set(roomName, session);

        // CDP 스크린캐스트 프레임 이벤트 리스너
        let lastFrameTime = 0;

        cdpSession.on('Page.screencastFrame', async ({ data, sessionId, metadata }) => {
            const now = Date.now();
            const timeSinceLastFrame = now - lastFrameTime;

            // 데이터 전송 (즉시)
            try {
                const buffer = Buffer.from(data, 'base64');
                io.to(roomName).emit('frame', buffer);
                session.lastImage = buffer;
            } catch (e) {
                console.error(`Error emitting frame for ${roomName}:`, e);
            }

            // Ack 전송 (FPS 동적 제한)
            const targetFps = session.fps || 60;
            const minInterval = 1000 / targetFps;
            const delay = Math.max(0, minInterval - timeSinceLastFrame);

            setTimeout(async () => {
                try {
                    if (session.cdpSession) {
                        await session.cdpSession.send('Page.screencastFrameAck', { sessionId });
                        lastFrameTime = Date.now();
                    }
                } catch (e) {
                    // 세션이 이미 닫혔거나 에러 발생 시 무시
                }
            }, delay);
        });

        // 스크린캐스트 시작
        await cdpSession.send('Page.startScreencast', {
            format: 'jpeg',
            quality: 50, // 기존 80에서 50으로 낮춰서 용량/네트워크 지연시간 대폭 감소
            everyNthFrame: 1, // 모든 프레임 전송
        });

    } catch (error) {
        console.error(`Failed to create room session for ${roomName}:`, error);
    }
}

// 방 세션 정리 (모든 사용자 이탈 시 호출)
async function cleanupRoomSession(roomName) {
    const session = rooms.get(roomName);
    if (!session) return;

    console.log(`🧹 Cleaning up browser session for room: ${roomName}`);

    // 1. CDP 세션 분리
    try {
        if (session.cdpSession) {
            await session.cdpSession.detach();
        }
    } catch (e) {
        console.error(`Error detaching CDP session for ${roomName}:`, e.message);
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

