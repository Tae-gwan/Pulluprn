"use client";

import React from "react";
import { usePathname } from "next/navigation";
import styles from "./MainLayout.module.css";
import LeftButtonLayout from "@/components/layout/LeftButtonLayout";
import RightButtonLayout from "@/components/layout/RightButtonLayout";
import Header from "@/components/layout/header";
import { useSocketConnection } from "@/hooks/useSocket";
import { SessionProvider, useSessionContext } from "@/context/SessionContext";

function MainLayoutContent({ children }: { children: React.ReactNode }) {
    const { isLoggedIn } = useSessionContext();
    const pathname = usePathname();
    const isSignupPage = pathname === "/user/signup";

    // 로그인된 사용자에게만 Socket 연결 (앱 전체에서 한 번만)
    // 주의: useSocketConnection은 항상 호출되어야 하며, 내부에서 세션 체크를 합니다.
    useSocketConnection();

    // 회원가입 페이지는 MainLayout 없이 렌더링
    if (isSignupPage) {
        return <>{children}</>;
    }

    // 영상 통화 페이지도 MainLayout 없이 전체 화면으로 렌더링
    const isVideoCallPage = pathname?.startsWith("/call/");
    if (isVideoCallPage) {
        return <>{children}</>;
    }

    return (
        <>
            <Header />
            <div className={styles.container}>
                {/* 배경 효과 */}
                <div className={styles.backgroundDecoration}>
                    <div className={`${styles.blurCircle} ${styles.blurCircle3}`}></div>
                </div>
                <div className={styles.noiseOverlay}></div>

                {isLoggedIn && (
                    <div className={styles.sideButtons}>
                        <LeftButtonLayout />
                    </div>
                )}

                <div className={styles.window}>
                    {children}
                </div>

                {isLoggedIn && (
                    <div className={styles.sideButtons}>
                        <RightButtonLayout />
                    </div>
                )}
            </div>
        </>
    );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <MainLayoutContent>
                {children}
            </MainLayoutContent>
        </SessionProvider>
    );
}
