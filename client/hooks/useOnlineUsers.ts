'use client';

import { useState, useEffect, useCallback } from 'react';
import { socketService } from '@/services/socketService';

/**
 * 온라인 사용자 목록을 관리하는 Hook
 * - Socket 이벤트로 실시간 온라인 상태 업데이트
 * - 온라인 사용자 ID 목록 관리
 * - isUserOnline 헬퍼 함수 제공
 */
export function useOnlineUsers() {
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

    // 온라인 유저 목록 요청
    useEffect(() => {
        if (socketService.isConnected()) {
            socketService.requestOnlineUsers();
        }
    }, []);

    // Socket 이벤트 리스너 등록
    useEffect(() => {
        if (!socketService.isConnected()) return;

        const handleUserOnline = ({ userId }: { userId: string }) => {
            setOnlineUserIds(prev => {
                const newSet = new Set(prev);
                newSet.add(userId);
                return newSet;
            });
        };

        const handleUserOffline = ({ userId }: { userId: string }) => {
            setOnlineUserIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        };

        const handleOnlineUsersList = (userIds: string[]) => {
            setOnlineUserIds(new Set(userIds));
        };

        socketService.onUserOnline(handleUserOnline);
        socketService.onUserOffline(handleUserOffline);
        socketService.onOnlineUsersList(handleOnlineUsersList);

        // cleanup - 등록한 이벤트만 제거
        return () => {
            const socket = socketService.getSocket();
            if (socket) {
                socket.off('user_online', handleUserOnline);
                socket.off('user_offline', handleUserOffline);
                socket.off('online_users_list', handleOnlineUsersList);
            }
        };
    }, []);

    // 특정 사용자가 온라인인지 확인하는 헬퍼 함수
    const isUserOnline = useCallback((userId: string) => {
        return onlineUserIds.has(userId);
    }, [onlineUserIds]);

    return {
        onlineUserIds,
        isUserOnline,
    };
}
