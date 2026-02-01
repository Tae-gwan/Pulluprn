export interface Message {
    id: string;
    text: string;
    type: 'my' | 'other';
    username: string;
    timestamp: number;
    senderId?: string;
    receiverId?: string;
}

export interface SocketMessageEvent {
    message: string;
    username: string;
    senderId?: string;
    receiverId?: string;
}
