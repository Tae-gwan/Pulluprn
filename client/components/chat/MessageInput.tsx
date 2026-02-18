'use client';

import { useRef } from 'react';
import styles from './MessageInput.module.css';

interface MessageInputProps {
    inputValue: string;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MessageInput = function MessageInput({ inputValue, handleSubmit, handleInputChange }: MessageInputProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
                {inputValue.trim().length > 0 && (
                    <button className={styles.sendButton} aria-label="Send message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(-45deg)", marginLeft: "2px", marginBottom: "2px" }}>
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                )}
            </form>
        </div>
    );
};

export default MessageInput;
