'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { socketService } from '@/services/socketService';
import { sortMessagesByTimestamp } from '@/utils/messageUtils';
import type { Message } from '@/types/message';

interface UseChatRoomOptions {
    roomId: string | null;
}

interface UseChatRoomReturn {
    messages: Message[];
    sortedMessages: Message[];
    isTyping: boolean;
    textWindowRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 채팅방을 관리하는 Hook
 * - 메시지 수신
 * - 타이핑 인디케이터
 * - 이전 메시지 불러오기
 * 
 * 주의: 
 * - Socket 연결은 useSocketConnection에서 관리합니다.
 * - 메시지 전송은 useMessageInput에서 관리합니다.
 */
export function useChatRoom({ roomId }: UseChatRoomOptions): UseChatRoomReturn {
    const { userId } = useSessionContext();
    const router = useRouter();

    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const textWindowRef = useRef<HTMLDivElement>(null);
    const loadedMessageIdsRef = useRef<Set<string>>(new Set()); // 중복 방지용

    // 메시지를 시간 순서대로 정렬
    const sortedMessages = sortMessagesByTimestamp(messages);

    // 이전 메시지 불러오기
    const loadPreviousMessages = useCallback(async (friendId: string) => {
        if (!friendId || isLoadingMessages) return;

        setIsLoadingMessages(true);

        try {
            const response = await fetch(`/api/messages?friendId=${friendId}&limit=100`);
            if (!response.ok) throw new Error('Failed to load messages');

            const data = await response.json();
            const loadedMessages: Message[] = data.messages.map((msg: any) => ({
                id: msg.id,
                text: msg.text,
                type: msg.type,
                username: msg.username,
                timestamp: msg.timestamp
            }));

            // 실시간으로 받은 메시지와 중복 방지
            const newMessages = loadedMessageIdsRef.current.size > 0
                ? loadedMessages.filter(msg => !loadedMessageIdsRef.current.has(msg.id))
                : loadedMessages;
            
            // 모든 새 메시지의 ID를 loadedMessageIdsRef에 추가
            newMessages.forEach(msg => loadedMessageIdsRef.current.add(msg.id));

            setMessages(prev => {
                if (prev.length === 0) {
                    return newMessages;
                }
                return [...newMessages, ...prev];
            });
        } catch (error) {
            console.error('메시지 불러오기 실패:', error);
        } finally {
            setIsLoadingMessages(false);
        }
    }, []);

    // 채팅방 변경 시 메시지 초기화 및 이벤트 등록
    useEffect(() => {
        // 친구가 변경되면 메시지 초기화
        setMessages([]);
        loadedMessageIdsRef.current.clear();

        if (!roomId) {
            return;
        }

        // userId가 없으면 오류 페이지로 이동
        if (!userId) {
            router.push('/error');
            return;
        }

        // Socket이 연결되어 있지 않으면 리턴
        if (!socketService.isConnected()) {
            return;
        }

        // 이전 메시지 불러오기
        loadPreviousMessages(roomId);

        // 이벤트 핸들러 정의
        const handleMyMessage = (message: Message) => {
            // 현재 채팅방의 메시지만 처리
            if (message.receiverId !== roomId) return;

            // 중복 체크
            if (!loadedMessageIdsRef.current.has(message.id)) {
                loadedMessageIdsRef.current.add(message.id);
                setMessages(prev => [...prev, message]);
            }
        };

        const handleOtherMessage = (message: Message) => {
            // 현재 채팅방의 메시지만 처리
            if (message.senderId !== roomId) return;

            // 중복 체크
            if (!loadedMessageIdsRef.current.has(message.id)) {
                loadedMessageIdsRef.current.add(message.id);
                setMessages(prev => [...prev, message]);
            }
        };

        const handleTyping = () => {
            setIsTyping(true);
        };

        const handleStopTyping = () => {
            setIsTyping(false);
        };

        // 이벤트 등록
        socketService.onMyMessage(handleMyMessage);
        socketService.onOtherMessage(handleOtherMessage);
        socketService.onTyping(handleTyping);
        socketService.onStopTyping(handleStopTyping);

        // cleanup - 등록한 이벤트만 제거
        return () => {
            const socket = socketService.getSocket();
            if (socket) {
                socket.off('my message');
                socket.off('other message');
                socket.off('typing message');
                socket.off('stop typing');
            }
        };
    }, [roomId, userId, router, loadPreviousMessages]);

    // 메시지가 추가되거나 타이핑 인디케이터가 표시될 때마다 스크롤을 맨 아래로 이동
    useEffect(() => {
        if (textWindowRef.current) {
            textWindowRef.current.scrollTop = textWindowRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    return {
        messages,
        sortedMessages,
        isTyping,
        textWindowRef,
    };
}
