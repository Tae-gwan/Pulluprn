import { useEffect, useRef, useState } from "react";
import { videoSocket } from "./videoSocket";

const rtcConfig: RTCConfiguration = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
        },
    ],
};

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "failed";

interface UseWebRTCProps {
    stream: MediaStream | null;
    roomName: string | null;
}

export function useWebRTC({ stream, roomName }: UseWebRTCProps) {
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        // MediaStream과 RoomName이 모두 준비되어야 시작
        if (!stream || !roomName) return;

        // React Strict Mode 대응: cleanup 후 stale 콜백 방지
        let mounted = true;

        setConnectionStatus("connecting");

        // 소켓 연결
        if (!videoSocket.connected) {
            videoSocket.connect();
        }

        // PeerConnection 생성
        const pc = new RTCPeerConnection(rtcConfig);
        peerConnectionRef.current = pc;

        // 내 트랙 추가
        stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
        });

        // 상대방 트랙 수신 했을 때 실행되는 이벤트 핸들러
        pc.ontrack = (event) => {
            if (!mounted) return;
            const [remote] = event.streams;
            if (remote) {
                setRemoteStream(remote);
            }
        };

        // 연결 상태 변경 감지
        pc.onconnectionstatechange = () => {
            if (!mounted) return;
            switch (pc.connectionState) {
                case "connected":
                    setConnectionStatus("connected");
                    break;
                case "disconnected":
                case "closed":
                    setConnectionStatus("disconnected");
                    break;
                case "failed":
                    setConnectionStatus("failed");
                    break;
                case "connecting":
                case "new":
                    setConnectionStatus("connecting");
                    break;
            }
        };

        // ICE Candidate 수집
        pc.onicecandidate = (event) => {
            if (!mounted) return;
            if (event.candidate) {
                videoSocket.emit("ice", event.candidate, roomName);
            }
        };

        // --- Signaling Event Handlers ---

        const createAndSendOffer = async () => {
            if (!mounted) return;
            // signalingState 체크 — 이미 offer/answer가 진행 중이면 무시
            if (pc.signalingState !== "stable") {
                console.warn(`Skipping offer creation: signalingState is "${pc.signalingState}"`);
                return;
            }
            try {
                const offer = await pc.createOffer();
                if (!mounted) return;
                await pc.setLocalDescription(offer);
                videoSocket.emit("offer", offer, roomName);
            } catch (e) {
                console.error("Error creating offer:", e);
            }
        };

        const handleOffer = async (offer: RTCSessionDescriptionInit) => {
            if (!mounted) return;
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                if (!mounted) return;
                await pc.setLocalDescription(answer);
                videoSocket.emit("answer", answer, roomName);
            } catch (e) {
                console.error("Error handling offer:", e);
            }
        };

        const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
            if (!mounted) return;
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (e) {
                console.error("Error handling answer:", e);
            }
        };

        const handleIce = async (ice: RTCIceCandidateInit) => {
            if (!mounted) return;
            try {
                await pc.addIceCandidate(new RTCIceCandidate(ice));
            } catch (e) {
                console.error("Error adding ICE candidate:", e);
            }
        };

        videoSocket.on("welcome", createAndSendOffer);
        videoSocket.on("offer", handleOffer);
        videoSocket.on("answer", handleAnswer);
        videoSocket.on("ice", handleIce);

        // 방 입장 
        videoSocket.emit("join_room", { roomName });

        // Cleanup
        return () => {
            mounted = false;

            // 1. 이벤트 리스너 먼저 제거 (stale 콜백 방지)
            videoSocket.off("welcome", createAndSendOffer);
            videoSocket.off("offer", handleOffer);
            videoSocket.off("answer", handleAnswer);
            videoSocket.off("ice", handleIce);

            // 2. PeerConnection 닫기
            pc.close();
            peerConnectionRef.current = null;

            // 3. 소켓 연결 해제
            videoSocket.disconnect();
            setConnectionStatus("disconnected");
        };
    }, [stream, roomName]);

    return { remoteStream, connectionStatus };
}

