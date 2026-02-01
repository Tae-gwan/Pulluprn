'use client';

import { useRef, memo } from 'react';
import styles from './MessageInput.module.css';
import { useMessageInput } from '@/hooks/useMessageInput';
import { SelectedFriend } from './types';

interface MessageInputProps {
    selectedFriend: SelectedFriend | null;
}

//memo를 통해 props가 변경되지 않을 경우 리렌더링을 하지 않음
const MessageInput = (function MessageInput({ selectedFriend }: MessageInputProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const {
        inputValue,
        handleSubmit,
        handleInputChange,
    } = useMessageInput({
        roomId: selectedFriend?.id || null,
    });

    return (
        <div className={styles.formContainer}>
            <form className={styles.form} ref={formRef} id="form" onSubmit={handleSubmit} action="">
                <input
                    className={styles.input}
                    ref={inputRef}
                    type="text"
                    id="input"
                    value={inputValue}
                    onChange={handleInputChange}
                />
                <button className={styles.sendButton}>Send</button>
            </form>
        </div>
    );
});

export default MessageInput;
