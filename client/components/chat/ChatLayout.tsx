"use client";

import styles from './ChatLayout.module.css';
import ChatList from './ChatList';

/*
 * ChatLayout
 * - 레이아웃만 담당
 * - 대화 목록은 ChatList 내부에서 useChatList 사용
 * - 온라인 상태는 ChatList 내부에서 useOnlineUsers 사용
 */

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    //왼쪽엔 대화목록, 오른쪽엔 채팅창
    return (
        <div className={styles.chatLayout}>
            <ChatList />
            {children}
        </div>
    );
}
