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
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                            <path d="M17 10.5V7c0-1.1-.9-2-2-2H5C3.9 5 3 5.9 3 7v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-3.5l4 4v-11l-4 4z" fill="currentColor" />
                        </svg>
                    </Link>
                )}
                {showMessageButton && (
                    <Link href={`/chat/${friend.id}`} className={styles.messageButton} aria-label="Chat">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="25"
                            height="25"
                        >
                            <path
                                d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                                fill="currentColor"
                            />
                        </svg>
                    </Link>
                )}
            </div>
        </div>
    );
}
