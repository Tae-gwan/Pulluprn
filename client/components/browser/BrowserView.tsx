'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import styles from './BrowserView.module.css';

interface BrowserViewProps {
    roomName: string;
    onClose?: () => void;
}

// Playwright에서 사용하는 특수 키 이름으로 매핑
const SPECIAL_KEYS: Record<string, string> = {
    'Enter': 'Enter',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
    'Tab': 'Tab',
    'Escape': 'Escape',
    'ArrowUp': 'ArrowUp',
    'ArrowDown': 'ArrowDown',
    'ArrowLeft': 'ArrowLeft',
    'ArrowRight': 'ArrowRight',
    'Home': 'Home',
    'End': 'End',
    'PageUp': 'PageUp',
    'PageDown': 'PageDown',
    'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4',
    'F5': 'F5', 'F6': 'F6', 'F7': 'F7', 'F8': 'F8',
    'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
    ' ': 'Space',
};

const BrowserView: React.FC<BrowserViewProps> = ({ roomName, onClose }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const viewPortRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const socketUrl = process.env.NEXT_PUBLIC_BROWSER_SOCKET_URL || 'http://localhost:3003';

        socketRef.current = io(socketUrl, {
            path: '/browser/socket.io',
            transports: ['websocket'],
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Connected to browser server');
            socket.emit('join_browser', { roomName });
        });

        socket.on('frame', (base64Image: string) => {
            setImageSrc(`data:image/jpeg;base64,${base64Image}`);
        });

        return () => {
            socket.disconnect();
        };
    }, [roomName]);

    // 클릭 이벤트 (좌표 스케일링 포함)
    const handleClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
        if (!socketRef.current || !imgRef.current) return;

        const rect = imgRef.current.getBoundingClientRect();
        const scaleX = imgRef.current.naturalWidth / rect.width;
        const scaleY = imgRef.current.naturalHeight / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        socketRef.current.emit('control_event', {
            roomName,
            type: 'click',
            x,
            y,
        });

        // 클릭 후 뷰포트에 포커스 유지 (키보드 입력 계속 받기 위해)
        viewPortRef.current?.focus();
    }, [roomName]);

    // 키보드 이벤트 → 원격 브라우저로 전송
    const handleViewportKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!socketRef.current) return;

        // 브라우저 기본 동작 방지 (스크롤, 뒤로가기 등)
        e.preventDefault();

        // Ctrl/Cmd 조합 키 처리 (복사, 붙여넣기, 전체선택 등)
        if (e.ctrlKey || e.metaKey) {
            const comboKey = `Control+${e.key}`;
            socketRef.current.emit('control_event', {
                roomName,
                type: 'key_press',
                key: comboKey,
            });
            return;
        }

        // 특수 키 (Enter, Backspace, 방향키 등)
        const specialKey = SPECIAL_KEYS[e.key];
        if (specialKey) {
            socketRef.current.emit('control_event', {
                roomName,
                type: 'key_press',
                key: specialKey,
            });
            return;
        }

        // 일반 문자 입력 (한 글자씩)
        if (e.key.length === 1) {
            socketRef.current.emit('control_event', {
                roomName,
                type: 'type',
                text: e.key,
            });
        }
    }, [roomName]);

    // URL 입력창 Enter 처리
    const handleUrlKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const target = e.target as HTMLInputElement;
            let url = target.value.trim();

            // http(s)로 시작하지 않으면 https 추가
            if (url && !url.startsWith('http')) {
                url = `https://${url}`;
            }

            if (url) {
                socketRef.current?.emit('control_event', {
                    roomName,
                    type: 'navigate',
                    url,
                });
                target.value = '';
            }
        }
    }, [roomName]);

    // 스크롤 이벤트
    const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        if (!socketRef.current) return;
        socketRef.current.emit('control_event', {
            roomName,
            type: 'scroll',
            deltaX: e.deltaX,
            deltaY: e.deltaY,
        });
    }, [roomName]);

    return (
        <div className={styles.container} onWheel={handleWheel}>
            {/* 상단 주소창 */}
            <div className={styles.controls}>
                <input
                    className={styles.urlInput}
                    placeholder="Enter URL to navigate..."
                    onKeyDown={handleUrlKeyDown}
                />
                <button onClick={() => socketRef.current?.emit('control_event', { roomName, type: 'back' })}>Back</button>
                <button onClick={() => socketRef.current?.emit('control_event', { roomName, type: 'reload' })}>Refresh</button>
                <button
                    onClick={() => {
                        // 서버에 브라우저 세션 종료 요청
                        socketRef.current?.emit('close_browser', { roomName });
                        onClose?.();
                    }}
                    style={{ marginLeft: 'auto', color: '#e74c3c', fontWeight: 'bold' }}
                    title="Close browser"
                >
                    ✕
                </button>
            </div>

            {/* 브라우저 뷰포트 (키보드 포커스 가능) */}
            <div
                ref={viewPortRef}
                className={styles.viewPort}
                tabIndex={0}
                onKeyDown={handleViewportKeyDown}
            >
                {imageSrc ? (
                    <img
                        ref={imgRef}
                        src={imageSrc}
                        alt="Remote Browser"
                        className={styles.browserImage}
                        onClick={handleClick}
                        draggable={false}
                    />
                ) : (
                    <div className={styles.loading}>Connecting to remote browser...</div>
                )}
            </div>
        </div>
    );
};

export default BrowserView;
