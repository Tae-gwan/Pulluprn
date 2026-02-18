"use client";

import Link from "next/link";
import styles from "./FriendItem.module.css";

interface Friend {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    status?: "online" | "offline";
}

interface FriendItemProps {
    friend: Friend;
    isOnline?: boolean;
    showMessageButton?: boolean;
    showCallButton?: boolean;
}

export default function FriendItem({
    friend,
    isOnline = false,
    showMessageButton = true,
    showCallButton = true
}: FriendItemProps) {
    return (
        <div className={styles.simpleFriendItem}>
            <div className={styles.friendAvatar}>
                {friend.image ? (
                    <img src={friend.image} alt={friend.name || ""} />
                ) : (
                    <div className={styles.avatarPlaceholder}>
                        {friend.name?.[0]?.toUpperCase() || "?"}
                    </div>
                )}
                {isOnline && <span className={styles.onlineIndicator}></span>}
            </div>
            <span className={styles.simpleFriendName}>
                {friend.name || friend.email || "No name"}
            </span>
            <div className={styles.actionButtons}>
                {showCallButton && (
                    <Link
                        href={`/call/${friend.id}?name=${encodeURIComponent(friend.name || "Friend")}`}
                        className={styles.callButton}
                        aria-label="Video call"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 7l-7 5 7 5V7z" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                    </Link>
                )}
                {showMessageButton && (
                    <Link href={`/chat/${friend.id}`} className={styles.messageButton} aria-label="Chat">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </Link>
                )}
            </div>
        </div>
    );
}
