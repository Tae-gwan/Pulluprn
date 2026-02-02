'use client';

import { Fragment, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './MessageWindow.module.css';
import { useChatRoom } from '@/hooks/useChatRoom';
import { shouldShowName } from '@/utils/messageUtils';
import { SelectedFriend } from './types';
import MessageInput from './MessageInput';

interface MessageWindowProps {
    selectedFriend: SelectedFriend | null;
}

const MessageWindow = memo(function MessageWindow({ selectedFriend }: MessageWindowProps) {
    const router = useRouter();
    const messagesRef = useRef<HTMLUListElement>(null);

    const {
        sortedMessages,
        isTyping,
        textWindowRef,
    } = useChatRoom({
        roomId: selectedFriend?.id || null,
    });

    return (
        <div className={styles.chatContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    {selectedFriend
                        ? selectedFriend.name || "No name"
                        : "Message"
                    }
                </h2>
                <button className={styles.closeButton} onClick={() => router.push('/chat')} aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            {selectedFriend ? (
                <>
                    <div ref={textWindowRef} className={styles.textWindow}>
                        <ul ref={messagesRef} className={styles.messages} id="messages">
                            {sortedMessages.map((message, index) => {
                                const prevMessage = index > 0 ? sortedMessages[index - 1] : null;
                                const showName = shouldShowName(message, prevMessage);

                                return (
                                    <Fragment key={message.id}>
                                        {showName && <li className={styles.otherName}>{message.username}</li>}
                                        <li
                                            className={message.type === 'my' ? styles.myMessage : styles.otherMessage}
                                        >
                                            <span>{message.text}</span>
                                        </li>
                                    </Fragment>
                                );
                            })}
                            {isTyping && (
                                <li className={styles.typing}>
                                    <span>
                                        <div className={styles['typing-dots']}>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </span>
                                </li>
                            )}
                        </ul>
                    </div>
                    <MessageInput 
                        selectedFriend={selectedFriend}
                    />
                </>
            ) : (
                <div className={styles.emptyChatState}>
                    <div className={styles.emptyChatMessage}>
                        Start a conversation
                    </div>
                    <div className={styles.emptyChatSubtext}>
                        Select a friend from the left to start chatting
                    </div>
                </div>
            )}
        </div>
    );
});

export default MessageWindow;
