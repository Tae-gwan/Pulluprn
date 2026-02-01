"use client";

import styles from './ChatLayout.module.css';
import ConversationList from './ConversationList';

/*
 * ChatLayout
 * - 레이아웃만 담당
 * - 대화 목록은 ConversationList 내부에서 useConversations 사용
 * - 온라인 상태는 ConversationList 내부에서 useOnlineUsers 사용
 */

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    //왼쪽엔 대화목록, 오른쪽엔 채팅창
    return (
        <div className={styles.chatLayout}>
            <ConversationList />
            {children}  
        </div>
    );
}
