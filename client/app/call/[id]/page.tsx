"use client";

import React, { use } from "react";
import { useSearchParams } from "next/navigation";
import { useSessionContext } from "@/context/SessionContext";
import { useVideoCall } from "@/hooks/videoCall/useVideoCall";
import styles from "./page.module.css";

export default function VideoCallWithFriendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId, username: myName } = useSessionContext();
  const { id: friendId } = use(params);
  const searchParams = useSearchParams();
  const friendName = searchParams.get("name") || "Friend";

  const { myVideoRef, remoteVideoRef, isJoined } = useVideoCall({
    userId,
    friendId,
  });

  if (!userId) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>
          Please sign in to use this feature.
        </h1>
      </div>
    );
  }

  return (
    <div className={styles.container}>


      {!isJoined ? (
        <div className={styles.loadingBox}>
          <p className={styles.loadingText}>
            Preparing the call...
          </p>
        </div>
      ) : (
        <div className={styles.videoGrid}>
          <div className={styles.videoWrapper}>
            <span className={styles.videoLabel}>
              {myName || "Me"}
            </span>
            <video
              ref={myVideoRef}
              autoPlay
              playsInline
              muted
              className={styles.myVideo}
            />
          </div>
          <div className={styles.videoWrapper}>
            <span className={styles.videoLabel}>
              {friendName}
            </span>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={styles.remoteVideo}
            />
          </div>
        </div>
      )}
    </div>
  );
}

