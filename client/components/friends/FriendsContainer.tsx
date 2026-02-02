"use client";

import { useState, useEffect, useMemo } from "react";
import { useSessionContext } from "@/context/SessionContext";
import Link from "next/link";
import styles from "./FriendsContainer.module.css";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import FriendItem from "./FriendItem";

interface Friend {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    status: "online" | "offline";
}

interface PendingRequest {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    friendshipId: string;
}

export default function FriendsContainer() {
    const [searchQuery, setSearchQuery] = useState("");
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingSent, setPendingSent] = useState<PendingRequest[]>([]);
    const [pendingReceived, setPendingReceived] = useState<PendingRequest[]>([]);
    const [searchResults, setSearchResults] = useState<Friend[]>([]);
    const [expandedSections, setExpandedSections] = useState<{
        search: boolean;
        received: boolean;
        sent: boolean;
    }>({
        search: true,
        received: true,
        sent: false,
    });
    const { email, userId } = useSessionContext();
    const { isUserOnline } = useOnlineUsers();

    // useOnlineUsers를 사용하여 온라인 상태 확인
    const onlineFriends = useMemo(() => 
        friends.filter((f) => isUserOnline(f.id)),
        [friends, isUserOnline]
    );
    const offlineFriends = useMemo(() => 
        friends.filter((f) => !isUserOnline(f.id)),
        [friends, isUserOnline]
    );

    useEffect(() => {
        if (email) {
            fetchFriends();
        }
    }, [email]);

    const fetchFriends = async () => {
        try {
            const response = await fetch("/api/friends");
            if (response.ok) {
                const data = await response.json();
                setFriends(data.friends || []);
                setPendingSent(data.pendingSent || []);
                setPendingReceived(data.pendingReceived || []);
            }
        } catch (error) {
            console.error("친구 목록 가져오기 실패:", error);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            const response = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.users || []);
                setExpandedSections(prev => ({ ...prev, search: true }));
            }
        } catch (error) {
            console.error("검색 실패:", error);
        }
    };

    const handleAddFriend = async (userId: string) => {
        try {
            const response = await fetch("/api/friends/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            if (response.ok) {
                alert("Friend request sent!");
                fetchFriends();
                // 검색 결과는 유지하되 재검색 하면 상태 업데이트 됨 (또는 수동 업데이트)
            } else {
                const data = await response.json();
                alert(data.error || "Failed to send friend request");
            }
        } catch (error) {
            console.error("친구 추가 실패:", error);
        }
    };

    const handleAcceptRequest = async (friendshipId: string) => {
        try {
            const response = await fetch("/api/friends/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ friendshipId, action: "accept" }),
            });

            if (response.ok) {
                alert("Friend request accepted!");
                fetchFriends();
            }
        } catch (error) {
            console.error("요청 수락 실패:", error);
        }
    };

    const handleDeclineRequest = async (friendshipId: string) => {
        try {
            const response = await fetch("/api/friends/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ friendshipId, action: "decline" }),
            });

            if (response.ok) {
                alert("Friend request declined.");
                fetchFriends();
            }
        } catch (error) {
            console.error("요청 거절 실패:", error);
        }
    };

    const isPendingSent = (userId: string) => {
        return pendingSent.some((req) => req.id === userId);
    };

    const isFriend = (userId: string) => {
        return friends.some(f => f.id === userId);
    }

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };


    return (
        <div className={styles.content}>
            <div className={styles.header}>
                <h2 className={styles.title}>Friends</h2>
            </div>

            {/* 친구 검색 섹션 */}
            <div className={styles.searchSection}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by email or name"
                        className={styles.searchInput}
                    />
                    <button type="submit" className={styles.searchButton}>search</button>
                </form>
            </div>

            {searchResults.length > 0 && (
                <div className={styles.accordionSection}>
                    <button
                        className={`${styles.accordionHeader} ${expandedSections.search ? styles.expandedHeader : ""
                            }`}
                        onClick={() => toggleSection("search")}
                    >
                        <span className={styles.accordionTitle}>
                            Search results ({searchResults.length})
                        </span>
                        <span
                            className={`${styles.accordionIcon} ${expandedSections.search ? styles.expanded : ""
                                }`}
                        >
                            ▶
                        </span>
                    </button>
                    {expandedSections.search && (
                        <div className={styles.accordionContent}>
                            {searchResults.map(user => (
                                <div key={user.id} className={styles.simpleFriendItem}>
                                    <div className={styles.friendAvatar}>
                                        {user.image ? (
                                            <img src={user.image} alt={user.name || ""} />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                {user.name?.[0]?.toUpperCase() || "?"}
                                            </div>
                                        )}
                                    </div>
                                    <span className={styles.simpleFriendName}>
                                        {user.name || user.email}
                                    </span>
                                    {user.id !== userId && !isFriend(user.id) && (
                                        isPendingSent(user.id) ? (
                                            <span className={styles.statusText}>Request sent</span>
                                        ) : (
                                            <button onClick={() => handleAddFriend(user.id)} className={styles.addButton}>
                                                Add
                                            </button>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 받은 요청 */}
            {pendingReceived.length > 0 && (
                <div className={styles.accordionSection}>
                    <button
                        className={`${styles.accordionHeader} ${expandedSections.received ? styles.expandedHeader : ""
                            }`}
                        onClick={() => toggleSection("received")}
                    >
                        <span className={styles.accordionTitle}>
                            Received requests ({pendingReceived.length})
                        </span>
                        <span className={`${styles.accordionIcon} ${expandedSections.received ? styles.expanded : ""}`}>▶</span>
                    </button>
                    {expandedSections.received && (
                        <div className={styles.accordionContent}>
                            {pendingReceived.map(req => (
                                <div key={req.id} className={styles.simpleFriendItem}>
                                    <div className={styles.friendAvatar}>
                                        {req.image ? (
                                            <img src={req.image} alt={req.name || ""} />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                {req.name?.[0]?.toUpperCase() || "?"}
                                            </div>
                                        )}
                                    </div>
                                    <span className={styles.simpleFriendName}>{req.name || req.email}</span>
                                    <div className={styles.actionButtons}>
                                        <button onClick={() => handleAcceptRequest(req.friendshipId)} className={styles.acceptButton}>Accept</button>
                                        <button onClick={() => handleDeclineRequest(req.friendshipId)} className={styles.declineButton}>Decline</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 보낸 요청 */}
            {pendingSent.length > 0 && (
                <div className={styles.accordionSection}>
                    <button
                        className={`${styles.accordionHeader} ${expandedSections.sent ? styles.expandedHeader : ""
                            }`}
                        onClick={() => toggleSection("sent")}
                    >
                        <span className={styles.accordionTitle}>
                            Sent requests ({pendingSent.length})
                        </span>
                        <span className={`${styles.accordionIcon} ${expandedSections.sent ? styles.expanded : ""}`}>▶</span>
                    </button>
                    {expandedSections.sent && (
                        <div className={styles.accordionContent}>
                            {pendingSent.map(req => (
                                <div key={req.id} className={styles.simpleFriendItem}>
                                    <div className={styles.friendAvatar}>
                                        {req.image ? (
                                            <img src={req.image} alt={req.name || ""} />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                {req.name?.[0]?.toUpperCase() || "?"}
                                            </div>
                                        )}
                                    </div>
                                    <span className={styles.simpleFriendName}>{req.name || req.email}</span>
                                    <span className={styles.statusText}>Pending</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 접속 중 / 오프라인 친구 컨테이너 */}
            <div className={styles.friendsGridContainer}>
                {/* 왼쪽: 접속 중 */}
                <div className={styles.friendsColumn}>
                    <div className={styles.columnHeader}>
                        <h3 className={styles.columnTitle}>Online ({onlineFriends.length})</h3>
                    </div>
                    <div className={styles.friendsList}>
                        {onlineFriends.length > 0 ? (
                            onlineFriends.map((friend) => (
                                <FriendItem 
                                    key={friend.id}
                                    friend={friend}
                                    isOnline={true}
                                />
                            ))
                        ) : (
                            <div className={styles.emptyState}>No friends online</div>
                        )}
                    </div>
                </div>

                {/* 오른쪽: 오프라인 */}
                <div className={styles.friendsColumn}>
                    <div className={styles.columnHeader}>
                        <h3 className={styles.columnTitle}>Offline ({offlineFriends.length})</h3>
                    </div>
                    <div className={styles.friendsList}>
                        {offlineFriends.length > 0 ? (
                            offlineFriends.map((friend) => (
                                <FriendItem 
                                    key={friend.id}
                                    friend={friend}
                                    isOnline={false}
                                />
                            ))
                        ) : (
                            <div className={styles.emptyState}>No offline friends</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
