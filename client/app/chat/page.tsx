"use client";

import styles from '@/components/chat/MessageWindow.module.css';

export default function MessagePage() {
    return (
        <div className={styles.emptyChatState}>
            <div className={styles.emptyChatMessage}>
                Start a conversation
            </div>
            <div className={styles.emptyChatSubtext}>
                Select a friend from the left to start chatting
            </div>
        </div>
    );
}
