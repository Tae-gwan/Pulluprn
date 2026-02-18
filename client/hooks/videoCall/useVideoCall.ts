"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";

import { useRouter } from "next/navigation";
import { useLocalStream } from "./useLocalStream";
import { useWebRTC, ConnectionStatus } from "./useWebRTC";
import { useMediaDevices } from "./useMediaDevices";

interface UseVideoCallParams {
  userId: string | null;
  friendId: string | null;
}

export function useVideoCall({ userId, friendId }: UseVideoCallParams) {
  const router = useRouter();

  // 방 이름 생성 (Memoization)
  const roomName = useMemo(() => {
    if (!userId || !friendId) return null;
    const sorted = [userId, friendId].sort();
    return `call-${sorted[0]}-${sorted[1]}`;
  }, [userId, friendId]);

  // 로컬 미디어 스트림 관리
  const {
    stream: myStream,
    startStream,
    stopStream,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    micVolume,
    changeMicVolume,
    switchDevice,
  } = useLocalStream();

  // WebRTC 및 소켓 연결 관리
  const { remoteStream, connectionStatus } = useWebRTC({ stream: myStream, roomName });

  // 미디어 장치 관리
  const {
    audioInputs,
    audioOutputs,
    videoInputs,
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,
    setSelectedAudioInput,
    setSelectedAudioOutput,
    setSelectedVideoInput,
  } = useMediaDevices();

  // Video Refs 관리 — Ref Callback 패턴 (레이아웃 변경 시 srcObject 자동 재연결)
  const myVideoNodeRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoNodeRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 상대방 볼륨 조절
  const [remoteVolume, setRemoteVolume] = useState(1);

  const changeRemoteVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setRemoteVolume(clampedVolume);
    if (remoteVideoNodeRef.current) {
      remoteVideoNodeRef.current.volume = clampedVolume;
    }
  }, []);

  // Callback Ref: <video> 노드가 생성/교체될 때마다 srcObject 자동 설정
  const myVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      myVideoNodeRef.current = node;
      if (node && myStream) {
        node.srcObject = myStream;
        node.muted = true;
      }
    },
    [myStream]
  );

  const remoteVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      remoteVideoNodeRef.current = node;
      if (node && remoteStream) {
        node.srcObject = remoteStream;
        node.setAttribute("playsinline", "true");
        node.volume = remoteVolume;
      }
    },
    [remoteStream, remoteVolume]
  );


  // 장치 변경 핸들러
  const handleDeviceChange = useCallback(async (kind: "audioinput" | "audiooutput" | "videoinput", deviceId: string) => {
    if (kind === "audioinput") {
      setSelectedAudioInput(deviceId);
      await switchDevice("audioinput", deviceId);
    } else if (kind === "videoinput") {
      setSelectedVideoInput(deviceId);
      await switchDevice("videoinput", deviceId);
    } else if (kind === "audiooutput") {
      setSelectedAudioOutput(deviceId);
      // 오디오 출력 변경 (setSinkId 지원 브라우저만)
      if (remoteVideoNodeRef.current && "setSinkId" in remoteVideoNodeRef.current) {
        try {
          await (remoteVideoNodeRef.current as any).setSinkId(deviceId);
        } catch (e) {
          console.error("Failed to set audio output:", e);
        }
      }
    }
  }, [switchDevice, setSelectedAudioInput, setSelectedAudioOutput, setSelectedVideoInput]);

  // 통화 시간 타이머
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (connectionStatus === "connected") {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [connectionStatus]);

  // 전체화면 토글
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Fullscreen 진입 실패:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // 통화 종료 상태 Ref
  const isCallEndedRef = useRef(false);

  // 자동 시작 트리거
  useEffect(() => {
    if (roomName && !myStream && !isCallEndedRef.current) {
      startStream();
    }
  }, [roomName, myStream, startStream]);

  // (srcObject 연결은 위의 Callback Ref에서 자동 처리됨)

  const isJoined = !!myStream;

  const endCall = () => {
    // 0. 통화 종료 플래그 설정 (재시작 방지)
    isCallEndedRef.current = true;

    // 1. 스트림 즉시 정리 (마이크 + 카메라 해제)
    stopStream();

    // 2. 비디오 엘리먼트에서 스트림 분리
    if (myVideoNodeRef.current) {
      myVideoNodeRef.current.srcObject = null;
    }
    if (remoteVideoNodeRef.current) {
      remoteVideoNodeRef.current.srcObject = null;
    }

    // 3. 페이지 이동
    router.back();
  };

  return {
    myVideoRef,
    remoteVideoRef,
    containerRef,
    isJoined,
    // 미디어 제어
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled,
    // 볼륨 제어
    micVolume,
    changeMicVolume,
    remoteVolume,
    changeRemoteVolume,
    // 연결 상태
    connectionStatus,
    // 통화 시간
    callDuration,
    // 전체화면
    isFullscreen,
    toggleFullscreen,
    // 장치 선택
    audioInputs,
    audioOutputs,
    videoInputs,
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,
    handleDeviceChange,
    // 통화 종료
    // 통화 종료
    endCall,
    // [Fix] Stream 객체 직접 반환 (Layout 변경 시 Re-attachment 재사용을 위해)
    myStream,
    remoteStream,
  };
}
