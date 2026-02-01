require('dotenv').config();
const express = require('express');
const app = express();

const http = require('http');
const socketIo = require('socket.io');
const prisma = require('./prisma');

const server = http.createServer(app);
const io = socketIo(server, {
    // Next.js 프론트엔드: localhost:3000에서 실행
    // Socket.IO 백엔드: localhost:3001에서 실행
    // 프론트엔드와 백엔드의 포트가 다르면 다른 origin으로 간주되어 CORS가 필요하다.
    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// 온라인 유저 관리 Map (userId -> Set<socketId>)
// 한 유저가 여러 탭(소켓)으로 접속할 수 있으므로 Set 사용
const onlineUsers = new Map();

io.on('connection', async (socket) => {
    const username = socket.handshake.query.username;
    const userId = socket.handshake.query.userId;

    // userId가 없으면 연결 거부
    if (!userId) {
        console.error('Connection rejected: userId is required');
        socket.disconnect(true);
        return;
    }

    // username이 없으면 기본값 사용
    const displayName = username || 'noname';

    console.log(`${displayName} (${userId}) connected`);

    // 온라인 상태 관리 로직
    if (!onlineUsers.has(userId)) {
        //한 사용자가 여러 탭으로 접속할 수 있기 때문에 Set사용
        onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // 친구 목록 한 번만 가져오기 (처음 접속 시)
    try {
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { senderId: userId, status: 'ACCEPTED' },
                    { receiverId: userId, status: 'ACCEPTED' }
                ]
            }
        });

        // 친구들의 userId 추출
        const friendIds = friendships.map(f =>
            f.senderId === userId ? f.receiverId : f.senderId
        );

        // 해당 유저가 "처음" 접속했을 때만 친구들에게 알림 (온라인 상태 변경 이벤트)
        if (onlineUsers.get(userId).size === 1) {
            // 모든 친구에게 전송 (소켓이 연결되어 있으면)
            friendIds.forEach(friendId => {
                if (onlineUsers.has(friendId)) {
                    const friendSockets = onlineUsers.get(friendId);  //친구가 여러 탭으로 접속할 수도 있기에 각 탭에 전송
                    friendSockets.forEach(socketId => {
                        // io.sockets.sockets는 Map<socketId, Socket>이므로 직접 접근 가능 Socket.IO의 모든 연결된 소켓을 담은 Map
                        const friendSocket = io.sockets.sockets.get(socketId);
                        if (friendSocket) {
                            friendSocket.emit('user_online', { userId });
                        }
                    });
                }
            });
        }

        // 접속한 유저에게 현재 온라인인 친구 목록만 전송
        const onlineFriendIds = friendIds.filter(friendId =>
            onlineUsers.has(friendId)
        );
        socket.emit('online_users_list', onlineFriendIds);
    } catch (error) {
        console.error('친구 목록 조회 오류:', error);
        // 오류 발생 시 기존 방식으로 fallback
        if (onlineUsers.get(userId).size === 1) {
            socket.broadcast.emit('user_online', { userId });
        }
        const onlineUserIdList = Array.from(onlineUsers.keys());
        socket.emit('online_users_list', onlineUserIdList);
    }

    // 사용자가 속한 모든 ChatRoom에 입장 (대화목록 미리보기 실시간 업데이트용)
    try {
        const chatRooms = await prisma.chatRoom.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            }
        });

        // 모든 ChatRoom에 Socket.IO Room으로 입장
        chatRooms.forEach(room => {
            socket.join(room.id);
            console.log(`User ${userId} joined room ${room.id}`);
        });
    } catch (error) {
        console.error('ChatRoom 조회 오류:', error);
    }

    socket.on('chat message', async ({ message, username, receiverId }) => {
        try {
            // receiverId가 없으면 브로드캐스트만 (기존 동작)
            if (!userId || !receiverId) {
                socket.emit('my message', {
                    message: message,
                    username: username
                });
                socket.broadcast.emit('other message', {
                    message: message,
                    username: username
                });
                return;
            }

            // ChatRoom 찾기 또는 생성
            let chatRoom = await prisma.chatRoom.findFirst({
                where: {
                    OR: [
                        { user1Id: userId, user2Id: receiverId },
                        { user1Id: receiverId, user2Id: userId }
                    ]
                }
            });

            if (!chatRoom) {
                // 새 채팅방 생성 (항상 작은 ID를 user1Id로)
                const [user1Id, user2Id] = userId < receiverId
                    ? [userId, receiverId]
                    : [receiverId, userId];

                chatRoom = await prisma.chatRoom.create({
                    data: {
                        user1Id,
                        user2Id,
                        lastMessageAt: new Date()
                    }
                });

                // 새 ChatRoom 생성 시 두 사용자 모두 해당 Room에 입장
                // 현재 사용자는 이미 socket에 연결되어 있으므로 join
                socket.join(chatRoom.id);

                // 상대방도 연결되어 있다면 해당 Room에 입장시킴
                // (상대방의 socket을 찾아서 join 시킴)
                const receiverSocket = Array.from(io.sockets.sockets.values())
                    .find(s => s.handshake.query.userId === receiverId);
                if (receiverSocket) {
                    receiverSocket.join(chatRoom.id);
                    console.log(`User ${receiverId} joined new room ${chatRoom.id}`);
                }
            } else {
                // 마지막 메시지 시간 업데이트
                await prisma.chatRoom.update({
                    where: { id: chatRoom.id },
                    data: { lastMessageAt: new Date() }
                });

                // 기존 ChatRoom에 입장 (혹시 모를 경우를 대비)
                socket.join(chatRoom.id);
            }

            // 메시지 저장
            await prisma.message.create({
                data: {
                    senderId: userId,
                    receiverId: receiverId,
                    text: message,
                    chatRoomId: chatRoom.id
                }
            });

            // 실시간 전송 (해당 ChatRoom에만 전송)
            socket.emit('my message', {
                message: message,
                username: username,
                senderId: userId,
                receiverId: receiverId
            });
            // 해당 ChatRoom에 속한 다른 사용자에게만 전송 (자신 제외)
            socket.to(chatRoom.id).emit('other message', {
                message: message,
                username: username,
                senderId: userId,
                receiverId: receiverId
            });
            // 대화목록 업데이트용 이벤트 (양쪽 사용자 모두에게 전송)
            const latestMessageData = {
                friendId: receiverId, // 상대방 ID
                lastMessage: message,
                timestamp: new Date().getTime()
            };
            socket.emit('latest message', latestMessageData);
            socket.to(chatRoom.id).emit('latest message', {
                friendId: userId, // 보낸 사람 ID
                lastMessage: message,
                timestamp: new Date().getTime()
            });
        } catch (error) {
            console.error('메시지 저장 오류:', error);
            // 오류가 나도 실시간 전송은 유지 (ChatRoom이 있는 경우에만)
            if (chatRoom) {
                socket.emit('my message', {
                    message: message,
                    username: username,
                    senderId: userId,
                    receiverId: receiverId
                });
                socket.to(chatRoom.id).emit('other message', {
                    message: message,
                    username: username,
                    senderId: userId,
                    receiverId: receiverId
                });
                // 대화목록 업데이트용 이벤트
                socket.emit('latest message', {
                    friendId: receiverId,
                    lastMessage: message,
                    timestamp: new Date().getTime()
                });
                socket.to(chatRoom.id).emit('latest message', {
                    friendId: userId,
                    lastMessage: message,
                    timestamp: new Date().getTime()
                });
            }
        }
    })

    socket.on('typing message', () => {
        socket.broadcast.emit('typing message');
    })

    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing');
    });

    // 온라인 유저 목록 수동 요청
    socket.on('get_online_users', () => {
        const onlineUserIdList = Array.from(onlineUsers.keys());
        socket.emit('online_users_list', onlineUserIdList);
    });

    socket.on('disconnect', (reason) => {
        socket.broadcast.emit('notification', `${displayName} is left.`);

        // 온라인 상태 관리: 연결 해제 처리
        if (userId && onlineUsers.has(userId)) {
            const userSockets = onlineUsers.get(userId);
            userSockets.delete(socket.id);

            // 해당 유저의 모든 소켓이 끊어졌을 때만 오프라인 처리
            if (userSockets.size === 0) {
                onlineUsers.delete(userId);
                socket.broadcast.emit('user_offline', { userId });
            }
        }
    });
});

server.listen(3001, () => {
    console.log('server is running on port 3001');
});