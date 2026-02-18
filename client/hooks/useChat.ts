'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { socketService } from '@/services/socketService';
import { sortMessagesByTimestamp } from '@/utils/messageUtils';
import type { Message } from '@/types/message';

interface UseChatOptions {
    roomId: string | null;
}

interface UseChatReturn {
    // 메시지 관련
    messages: Message[];
    sortedMessages: Message[];
    isTyping: boolean;
    textWindowRef: React.RefObject<HTMLDivElement | null>;
    // 입력 관련
    inputValue: string;
    setInputValue: (value: string) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * 채팅방 전체 로직을 관리하는 Hook
 * - 메시지 수신 + 이전 메시지 로드
 * - 메시지 입력 + 전송
 * - 타이핑 인디케이터 (수신 + 발신)
 */
export function useChat({ roomId }: UseChatOptions): UseChatReturn {
    const { userId, username } = useSessionContext();
    const router = useRouter();

    // ─── 메시지 상태 ───
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const textWindowRef = useRef<HTMLDivElement>(null);
    const loadedMessageIdsRef = useRef<Set<string>>(new Set());

    const sortedMessages = sortMessagesByTimestamp(messages);

    // ─── 입력 상태 ───
    const [inputValue, setInputValue] = useState('');
    const lastTypingEmitRef = useRef<number>(0);

    // ─── 이전 메시지 불러오기 ───
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

            const newMessages = loadedMessageIdsRef.current.size > 0
                ? loadedMessages.filter(msg => !loadedMessageIdsRef.current.has(msg.id))
                : loadedMessages;

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

    // ─── 채팅방 변경 시 메시지 초기화 및 이벤트 등록 ───
    useEffect(() => {
        setMessages([]);
        loadedMessageIdsRef.current.clear();
        setInputValue('');

        if (!roomId) return;

        if (!userId) {
            router.push('/error');
            return;
        }

        if (!socketService.isConnected()) return;

        loadPreviousMessages(roomId);

        const handleMyMessage = (message: Message) => {
            if (message.receiverId !== roomId) return;
            if (!loadedMessageIdsRef.current.has(message.id)) {
                loadedMessageIdsRef.current.add(message.id);
                setMessages(prev => [...prev, message]);
            }
        };

        const handleOtherMessage = (message: Message) => {
            if (message.senderId !== roomId) return;
            if (!loadedMessageIdsRef.current.has(message.id)) {
                loadedMessageIdsRef.current.add(message.id);
                setMessages(prev => [...prev, message]);
            }
        };

        const handleTyping = () => setIsTyping(true);
        const handleStopTyping = () => setIsTyping(false);

        socketService.onMyMessage(handleMyMessage);
        socketService.onOtherMessage(handleOtherMessage);
        socketService.onTyping(handleTyping);
        socketService.onStopTyping(handleStopTyping);

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

    // ─── 스크롤 자동 이동 ───
    useEffect(() => {
        if (textWindowRef.current) {
            textWindowRef.current.scrollTop = textWindowRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // ─── 메시지 전송 ───
    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            if (inputValue.trim() !== '' && socketService.isConnected() && roomId && username) {
                const messageText = inputValue.trim();
                socketService.sendMessage(messageText, username, roomId);
                socketService.clearTypingTimer();
                socketService.emitStopTyping();
            }
            setInputValue('');
        },
        [inputValue, username, roomId]
    );

    // ─── 입력 변경 + 타이핑 이벤트 ───
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        if (!socketService.isConnected()) return;

        if (!value.trim()) {
            socketService.clearTypingTimer();
            socketService.emitStopTyping();
            return;
        }

        const now = Date.now();
        if (now - lastTypingEmitRef.current >= 3000) {
            socketService.emitTyping();
            lastTypingEmitRef.current = now;
        }

        socketService.startTypingTimer();
    }, []);

    return {
        messages,
        sortedMessages,
        isTyping,
        textWindowRef,
        inputValue,
        setInputValue,
        handleSubmit,
        handleInputChange,
    };
}
