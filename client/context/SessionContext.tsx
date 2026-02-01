"use client";

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface SessionContextType {
    username: string;
    userId: string | null;
    email: string | null;
    status: 'authenticated' | 'unauthenticated' | 'loading';
    isLoggedIn: boolean;
    session: any; // NextAuth session 객체 (필요한 경우)
}

//Context객체 생성
const SessionContext = createContext<SessionContextType | null>(null);

export const useSessionContext = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSessionContext must be used within a SessionProvider');
    }
    return context;
};

interface SessionProviderProps {
    children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
    const { data: session, status } = useSession();

    const value = useMemo(() => ({
        username: session?.user?.name || 'Guest',
        userId: (session?.user as any)?.id || null,
        email: session?.user?.email || null,
        status: status as 'authenticated' | 'unauthenticated' | 'loading',
        isLoggedIn: status === 'authenticated',
        session, // 필요시 원본 session 객체도 제공
    }), [session, status]);

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}
