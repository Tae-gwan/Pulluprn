'use client';

import { useState, useCallback, useRef } from 'react';
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

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (inputValue.trim() !== '' && socketService.isConnected() && roomId && username) {
            const messageText = inputValue.trim();
            socketService.sendMessage(messageText, username, roomId);
            socketService.clearTypingTimer();
            socketService.emitStopTyping();
        }
        setInputValue('');
    };

    const lastTypingEmitRef = useRef<number>(0);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    };

    return {
        inputValue,
        setInputValue,
        handleSubmit,
        handleInputChange,
    };
}
