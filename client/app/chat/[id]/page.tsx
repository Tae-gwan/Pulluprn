"use client";

import { useState, useEffect, use } from 'react';
import MessageWindow from '@/components/chat/MessageWindow';
import styles from '@/components/chat/MessageWindow.module.css';

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string | null; image: string | null } | null>(null);

    // 친구 정보 가져오기 (이름, 이미지 표시 목적)
    // /api/user/[id] API를 통해 해당 친구의 정보만 효율적으로 가져옴
    useEffect(() => {
        const fetchFriendInfo = async () => {
            try {
                const response = await fetch(`/api/user/${id}`);
                if (response.ok) {
                    const friend = await response.json();
                    setSelectedFriend({
                        id: friend.id,
                        name: friend.name,
                        image: friend.image
                    });
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchFriendInfo();
    }, [id]);

    if (!selectedFriend) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <MessageWindow
            selectedFriend={selectedFriend}
        />
    );
}
