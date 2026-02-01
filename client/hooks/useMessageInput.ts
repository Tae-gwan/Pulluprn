'use client';

import { useState, useCallback } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { socketService } from '@/services/socketService';

interface UseMessageInputOptions {
    roomId: string | null;
}

interface UseMessageInputReturn {
    inputValue: string;
    setInputValue: (value: string) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/*
 * 메시지 입력 및 전송을 관리하는 Hook
 * - 입력 상태 관리
 * - 메시지 전송
 * - 타이핑 인디케이터 관리
 */
export function useMessageInput({
    roomId,
}: UseMessageInputOptions): UseMessageInputReturn {
    const { username } = useSessionContext();
    const [inputValue, setInputValue] = useState('');

    // 폼 제출 핸들러
    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            if (inputValue.trim() !== '' && socketService.isConnected() && roomId && username) {
                const messageText = inputValue.trim();
                socketService.sendMessage(messageText, username, roomId);

                // 타이핑 타이머 클리어 및 stop typing 전송
                socketService.clearTypingTimer();
                socketService.emitStopTyping();
            }
            setInputValue('');
        },
        [inputValue, username, roomId]
    );

    // 입력 변경 핸들러
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        if (!socketService.isConnected()) return;

        // 입력란이 비어있으면 stop typing 전송
        if (!value.trim()) {
            socketService.clearTypingTimer();
            socketService.emitStopTyping();
            return;
        }

        // 타이핑 시작 이벤트 전송
        socketService.emitTyping();

        // 1초 후 stop typing 전송 (타이머 시작)
        socketService.startTypingTimer();
    }, []);

    return {
        inputValue,
        setInputValue,
        handleSubmit,
        handleInputChange,
    };
}
