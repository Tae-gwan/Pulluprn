"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "./page.module.css";

interface User {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.user?.email) {
            fetchProfile();
        }
    }, [session]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/user/profile");
            if (response.ok) {
                const data = await response.json();
                setUser(data);
            }
        } catch (error) {
            console.error("프로필 가져오기 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.profileContentContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>Profile</h2>
            </div>

            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>Loading...</div>
                ) : user ? (
                    <>
                        {/* Photo */}
                        <div className={styles.row}>
                            <span className={styles.label}>Photo</span>
                            <div className={styles.value}>
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt="Profile"
                                        className={styles.profileImage}
                                    />
                                ) : (
                                    <div className={styles.profileImage} />
                                )}
                            </div>
                        </div>

                        {/* Username */}
                        <div className={styles.row}>
                            <span className={styles.label}>Username</span>
                            <div className={styles.value}>
                                {user.name || "설정되지 않음"}
                            </div>
                        </div>

                        {/* Email */}
                        <div className={styles.row}>
                            <span className={styles.label}>Email</span>
                            <div className={styles.emailWrapper}>
                                <span>{user.email}</span>
                                {!user.emailVerified ? (
                                    <div className={styles.unverified}>
                                        ⚠️ Unverified
                                        <span className={styles.verifyLink}>· Send verification email</span>
                                    </div>
                                ) : (
                                    <span className={styles.verified}>✓ Verified</span>
                                )}
                            </div>
                        </div>

                        {/* Name */}
                        <div className={styles.row}>
                            <span className={styles.label}>Name</span>
                            <div className={styles.value}>
                                {user.name || "설정되지 않음"}
                            </div>
                        </div>

                        {/* User ID */}
                        <div className={styles.row}>
                            <span className={styles.label}>User ID</span>
                            <div className={styles.value}>
                                <span className={styles.userId}>{user.id}</span>
                            </div>
                        </div>

                        {/* Edit Button (Placeholder) */}
                        <div className={styles.row}>
                            <span className={styles.label}></span>
                            <button className={styles.editButton} onClick={() => alert("준비 중입니다.")}>
                                Edit Profile
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.error}>유저 정보를 찾을 수 없습니다.</div>
                )}
            </div>
        </div>
    );
}
