"use client";

import styles from '@/components/chat/MessageWindow.module.css';

export default function MessagePage() {
    return (
        <div className={styles.emptyChatState}>
            <div className={styles.emptyChatMessage}>
                채팅을 시작하세요
            </div>
            <div className={styles.emptyChatSubtext}>
                왼쪽에서 대화할 친구를 선택해주세요
            </div>
        </div>
    );
}
