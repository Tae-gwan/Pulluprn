import io, { Socket } from 'socket.io-client';
import type { Message, SocketMessageEvent } from '@/types/message';

//클라이언트에서 서버로 Socket.IO 데이터를 보내고 받음
//싱글톤으로 실행(SocketService 인스턴스는 하나만 존재)
export class SocketService {
    private socket: Socket | null = null;
    private typingTimer: NodeJS.Timeout | null = null;
    private readonly TYPING_DELAY = 1000;

    // Socket 연결
    connect(username: string, userId: string, serverUrl: string = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"): void {
        if (!userId) {
            throw new Error('userId is required for socket connection');
        }
        this.socket = io(serverUrl, {
            query: {
                username,
                userId
            }
        });
    }

    // 연결 해제
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.clearTypingTimer();
    }

    // 메시지 전송
    sendMessage(message: string, username: string, receiverId?: string): void {
        if (!this.socket) return;

        this.socket.emit('chat message', {
            message,
            username,
            receiverId: receiverId || undefined
        });
    }

    // 내가 보낸 메시지 수신 이벤트 등록
    onMyMessage(callback: (message: Message) => void): void {
        if (!this.socket) return;

        // on은 이벤트 리스너 등록하는 Socket의 메서드
        this.socket.on('my message', ({ message, username, senderId, receiverId }: SocketMessageEvent) => {
            const newMessage: Message = {
                id: Date.now().toString(),
                text: message,
                type: 'my',
                username,
                timestamp: Date.now(),
                senderId,
                receiverId
            };
            callback(newMessage);
        });
    }

    // 상대가 보낸 메시지 수신 이벤트 등록
    onOtherMessage(callback: (message: Message) => void): void {
        if (!this.socket) return;

        this.socket.on('other message', ({ message, username, senderId, receiverId }: SocketMessageEvent) => {
            const newMessage: Message = {
                id: Date.now().toString(),
                text: message,
                type: 'other',
                username,
                timestamp: Date.now(),
                senderId,
                receiverId
            };
            callback(newMessage);
        });
    }

    // 타이핑 시작 이벤트 등록
    onTyping(callback: () => void): void {
        if (!this.socket) return;
        this.socket.on('typing message', callback);
    }

    // 타이핑 중지 이벤트 등록
    onStopTyping(callback: () => void): void {
        if (!this.socket) return;
        this.socket.on('stop typing', callback);
    }

    // 타이핑 시작 신호 전송
    emitTyping(): void {
        if (!this.socket) return;
        this.socket.emit('typing message');
    }

    // 타이핑 중지 신호 전송
    emitStopTyping(): void {
        if (!this.socket) return;
        this.socket.emit('stop typing');
    }

    // 타이핑 타이머 시작 (1초 후 자동으로 stop typing 전송)
    startTypingTimer(): void {
        this.clearTypingTimer();
        this.typingTimer = setTimeout(() => {
            this.emitStopTyping();
            this.typingTimer = null;
        }, this.TYPING_DELAY);
    }

    // 타이핑 타이머 클리어
    clearTypingTimer(): void {
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
    }

    // 온라인 상태 변경 이벤트 등록
    onUserOnline(callback: (data: { userId: string }) => void): void {
        if (!this.socket) return;
        this.socket.on('user_online', callback);
    }


    // 오프라인 상태 변경 이벤트 등록
    onUserOffline(callback: (data: { userId: string }) => void): void {
        if (!this.socket) return;
        this.socket.on('user_offline', callback);
    }

    // 온라인 유저 목록 수신 이벤트 등록
    onOnlineUsersList(callback: (userIds: string[]) => void): void {
        if (!this.socket) return;
        this.socket.on('online_users_list', callback);
    }

    // 온라인 유저 목록 요청
    requestOnlineUsers(): void {
        if (!this.socket) return;
        this.socket.emit('get_online_users');
    }

    // 대화목록 최신 메시지 업데이트 이벤트 등록
    onLatestMessage(callback: (data: { friendId: string; lastMessage: string; timestamp: number }) => void): void {
        if (!this.socket) return;
        this.socket.on('latest message', callback);
    }

    // 모든 이벤트 리스너 제거
    removeAllListeners(): void {
        if (this.socket) {
            this.socket.removeAllListeners('my message');
            this.socket.removeAllListeners('other message');
            this.socket.removeAllListeners('typing message');
            this.socket.removeAllListeners('stop typing');
            this.socket.removeAllListeners('user_online');
            this.socket.removeAllListeners('user_offline');
            this.socket.removeAllListeners('online_users_list');
        }
    }

    // Socket 연결 상태 확인
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }
    // Socket 객체 반환 (직접 사용이 필요한 경우)
    getSocket(): Socket | null {
        return this.socket;
    }
}

export const socketService = new SocketService();
