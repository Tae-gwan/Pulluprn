'use client';

import { useState, useEffect } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { socketService } from '@/services/socketService';
import { ChatRoom } from '@/components/chat/types';

/**
 * 대화 목록을 관리하는 Hook
 * - API로 초기 데이터 가져오기
 * - Socket 이벤트로 실시간 마지막 메시지 업데이트
 * 
 * 주의:
 * - 온라인 상태는 useOnlineUsers에서 별도로 관리합니다.
 */
export function useConversations() {
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const { email, userId } = useSessionContext();

    // 대화 목록 가져오기
    useEffect(() => {
        if (!email) return;

        const fetchConversations = async () => {
            try {
                const response = await fetch("/api/messages/conversations");
                if (response.ok) {
                    const data = await response.json();
                    // conversations를 ChatRoom 형식으로 변환
                    const rooms: ChatRoom[] = (data.conversations || []).map((conv: {
                        friend: { id: string; name: string | null; image: string | null; status: "online" | "offline" };
                        lastMessage: { text: string; timestamp: number } | null;
                        chatRoomId: string | null;
                    }) => ({
                        id: conv.friend.id,
                        name: conv.friend.name,
                        email: null,
                        image: conv.friend.image,
                        status: "offline" as const, // 초기값은 offline, useOnlineUsers에서 관리
                        lastMessage: conv.lastMessage?.text || "",
                        lastMessageTime: conv.lastMessage?.timestamp || 0,
                    }));
                    setChatRooms(rooms);
                }
            } catch (error) {
                console.error("대화 목록 가져오기 실패:", error);
            }
        };

        fetchConversations();
    }, [email]);

    // Socket 이벤트로 마지막 메시지 업데이트 (대화목록 전용)
    useEffect(() => {
        if (!socketService.isConnected()) return;
        if (!userId) return;

        const handleLatestMessage = (data: { friendId: string; lastMessage: string; timestamp: number }) => {
            setChatRooms(prev => {
                const updated = prev.map(room => {
                    if (room.id === data.friendId) {
                        return {
                            ...room,
                            lastMessage: data.lastMessage,
                            lastMessageTime: data.timestamp
                        };
                    }
                    return room;
                });
                // 마지막 메시지 시간 기준으로 정렬 (최신순)
                updated.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
                return updated;
            });
        };

        socketService.onLatestMessage(handleLatestMessage);

        // cleanup - 등록한 이벤트만 제거
        return () => {
            const socket = socketService.getSocket();
            if (socket) {
                socket.off('latest message', handleLatestMessage);
            }
        };
    }, [userId]);

    return {
        chatRooms,
    };
}
