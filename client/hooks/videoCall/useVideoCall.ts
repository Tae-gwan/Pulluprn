"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useLocalStream } from "./useLocalStream";
import { useWebRTC } from "./useWebRTC";

interface UseVideoCallParams {
  userId: string | null;
  friendId: string | null;
}

interface UseVideoCallResult {
  myVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  isJoined: boolean;
}

export function useVideoCall({
  userId,
  friendId,
}: UseVideoCallParams): UseVideoCallResult {
  // 방 이름 생성 (Memoization)
  const roomName = useMemo(() => {
    if (!userId || !friendId) return null;
    const sorted = [userId, friendId].sort();
    return `call-${sorted[0]}-${sorted[1]}`;
  }, [userId, friendId]);

  // 로컬 미디어 스트림 관리
  const { stream: myStream, startStream } = useLocalStream();

  // WebRTC 및 소켓 연결 관리
  // myStream과 roomName이 준비되면 내부에서 자동으로 소켓 연결 및 P2P 협상 시작
  const { remoteStream } = useWebRTC({ stream: myStream, roomName });

  // Video Refs 관리 (UI 바인딩용)
  const myVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // 자동 시작 트리거: 방 이름이 준비되면 바로 스트림 요청
  useEffect(() => {
    if (roomName && !myStream) {
      startStream();
    }
  }, [roomName, myStream, startStream]);

  // 스트림을 비디오 엘리먼트에 연결
  useEffect(() => {
    if (myVideoRef.current && myStream) {
      myVideoRef.current.srcObject = myStream;
      // 로컬 비디오는 소리 끔 (하울링 방지) or muted attribute in JSX
      myVideoRef.current.muted = true;
    }
  }, [myStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.setAttribute("playsinline", "true");
    }
  }, [remoteStream]);

  // isJoined: 내 스트림이 확보되면 방에 참여한 것으로 간주 (단순화)
  const isJoined = !!myStream;

  return {
    myVideoRef,
    remoteVideoRef,
    isJoined,
  };
}
