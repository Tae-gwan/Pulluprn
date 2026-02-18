'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './ConversationList.module.css';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useConversations } from '@/hooks/useConversations';

export default function ConversationList() {
    const pathname = usePathname();
    const router = useRouter();
    const [optimisticActiveId, setOptimisticActiveId] = useState<string | null>(null);
    const { chatRooms } = useConversations();
    const { isUserOnline } = useOnlineUsers();

    // Pathname이 변경되면 낙관적 상태 초기화 (실제 네비게이션 완료 시)
    useEffect(() => {
        setOptimisticActiveId(null);
    }, [pathname]);

    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
                <h3 className={styles.sidebarTitle}>Messages</h3>
            </div>

            {/* 대화 목록 */}
            <div className={styles.section}>
                <div className={styles.list}>
                    {chatRooms.length > 0 ? (
                        chatRooms.map((room) => {
                            // ModalButton과 동일한 방식: pathname으로 active 상태 확인 + optimisticActive
                            const isActive = pathname === `/chat/${room.id}` || optimisticActiveId === room.id;

                            const handleClick = () => {
                                // active 상태일 때 다시 클릭하면 선택 해제
                                if (isActive && pathname === `/chat/${room.id}`) {
                                    setOptimisticActiveId(null);
                                    router.push('/chat');
                                    return;
                                }
                                // 일반 클릭: optimisticActive 설정 및 네비게이션
                                setOptimisticActiveId(room.id);
                                router.push(`/chat/${room.id}`);
                            };

                            return (
                                <div
                                    key={room.id}
                                    className={`${styles.listItem} ${isActive ? styles.active : ''}`}
                                    onClick={handleClick}
                                >
                                    {/* avatar는 나중에 따로 컴포넌트 만드는 거 고려 */}
                                    <div className={styles.avatar}>
                                        {room.image ? (
                                            <img src={room.image} alt={room.name || ""} />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                {room.name?.[0]?.toUpperCase() || "?"}
                                            </div>
                                        )}
                                        {isUserOnline(room.id) && <span className={styles.onlineIndicator}></span>}
                                    </div>
                                    <div className={styles.itemInfo}>
                                        <div className={styles.itemName}>
                                            {room.name || room.email || "No name"}
                                        </div>
                                        {room.lastMessage && (
                                            <div className={styles.itemPreview}>
                                                {room.lastMessage}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className={styles.emptyState}>No conversations yet</div>
                    )}
                </div>
            </div>
        </div>
    );
}
