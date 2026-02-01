export interface ChatRoom {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    status: "online" | "offline";
    lastMessage?: string;
    lastMessageTime?: number;
}

export interface SelectedFriend {
    id: string;
    name: string | null;
    image: string | null;
}
