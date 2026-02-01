'use client';

import { useEffect } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { socketService } from '@/services/socketService';

/**
 * Socket 연결을 관리하는 Hook
 * 앱 전체에서 한 번만 연결하고, 연결 상태를 관리합니다.
 */
export function useSocketConnection() {
    const { email, username, userId, isLoggedIn } = useSessionContext();

    useEffect(() => {
        if (!isLoggedIn || !email) {
            // 세션이 없으면 연결 해제
            if (socketService.isConnected()) {
                socketService.disconnect();
            }
            return;
        }

        if (!userId) return;

        // Socket 연결 (이미 연결되어 있으면 연결하지 않음)
        if (!socketService.isConnected()) {
            socketService.connect(username, userId);
        }
    }, [email, username, userId, isLoggedIn]);
}
