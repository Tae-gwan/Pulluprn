"use client";

import React, { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSessionContext } from "@/context/SessionContext";
import { useVideoCall } from "@/hooks/videoCall/useVideoCall";
import FloatingControlBar from "@/components/video/FloatingControlBar";
import BrowserView from "@/components/browser/BrowserView";
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

  // 브라우저 공유 상태: started = 세션 존재, visible = UI 표시
  const [isBrowserStarted, setIsBrowserStarted] = useState(false);
  const [isBrowserVisible, setIsBrowserVisible] = useState(false);

  // 브라우저 토글 (시작 안 됐으면 시작+보이기, 시작됐으면 보이기만 토글)
  const toggleBrowser = () => {
    if (!isBrowserStarted) {
      setIsBrowserStarted(true);
      setIsBrowserVisible(true);
    } else {
      setIsBrowserVisible((v) => !v);
    }
  };

  // 브라우저 완전 종료 (X 버튼)
  const closeBrowser = () => {
    setIsBrowserStarted(false);
    setIsBrowserVisible(false);
  };

  const {
    myVideoRef,
    remoteVideoRef,
    containerRef,
    isJoined,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled,
    micVolume,
    changeMicVolume,
    remoteVolume,
    changeRemoteVolume,
    connectionStatus,
    callDuration,
    isFullscreen,
    toggleFullscreen,
    audioInputs,
    audioOutputs,
    videoInputs,
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,
    handleDeviceChange,
    endCall,
  } = useVideoCall({
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

  // 룸 이름 생성 (간단히 두 ID 조합하여 정렬)
  const roomName = [userId, friendId].sort().join("-");

  return (
    <div className={styles.container} ref={containerRef}>
      {/* 메인 콘텐츠 영역 */}
      <div className={styles.videoArea}>
        {!isJoined ? (
          <div className={styles.loadingBox}>
            <p className={styles.loadingText}>Preparing the call...</p>
          </div>
        ) : (
          <div className={isBrowserVisible ? styles.browserMode : styles.videoGrid}>
            {/* 브라우저 영역 (started면 항상 마운트, visible 아니면 숨김) */}
            {isBrowserStarted && (
              <div className={`${styles.browserArea} ${!isBrowserVisible ? styles.browserAreaHidden : ''}`}>
                <BrowserView roomName={roomName} onClose={closeBrowser} />
              </div>
            )}

            {/* 비디오 영역 - 항상 렌더링 (unmount 방지) */}
            <div className={isBrowserVisible ? styles.sideVideoColumn : styles.videoGridInner}>
              {/* 상대방 화면 (브라우저모드: 위 / 기본: 왼쪽) */}
              <div className={isBrowserVisible ? styles.sideVideoWrapper : styles.videoWrapper}>
                <span className={isBrowserVisible ? styles.sideVideoLabel : styles.videoLabel}>
                  {friendName}
                </span>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={styles.remoteVideo}
                />
              </div>
              {/* 내 화면 (브라우저모드: 아래 / 기본: 오른쪽) */}
              <div className={isBrowserVisible ? styles.sideVideoWrapper : styles.videoWrapper}>
                <span className={isBrowserVisible ? styles.sideVideoLabel : styles.videoLabel}>
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
            </div>
          </div>
        )}
      </div>

      {/* 하단 컨트롤 바 */}
      <FloatingControlBar
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        endCall={endCall}
        micVolume={micVolume}
        changeMicVolume={changeMicVolume}
        remoteVolume={remoteVolume}
        changeRemoteVolume={changeRemoteVolume}
        connectionStatus={connectionStatus}
        callDuration={callDuration}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        audioInputs={audioInputs}
        audioOutputs={audioOutputs}
        videoInputs={videoInputs}
        selectedAudioInput={selectedAudioInput}
        selectedAudioOutput={selectedAudioOutput}
        selectedVideoInput={selectedVideoInput}
        onDeviceChange={handleDeviceChange}
        // 브라우저 제어 props 전달
        isBrowserOpen={isBrowserVisible}
        toggleBrowser={toggleBrowser}
      />
    </div>
  );
}
