import { useEffect, useRef, useState } from "react";
import { videoSocket } from "./videoSocket";

// ---------------------------------------------------------------------------
// ICE Server 설정
// TURN 서버는 Oracle Cloud에서 coturn을 docker network_mode:host로 실행 중.
// 외부 IP는 환경변수 NEXT_PUBLIC_TURN_HOST 로 주입 (예: "123.456.789.0")
// ---------------------------------------------------------------------------
const buildIceServers = (): RTCIceServer[] => {
    const servers: RTCIceServer[] = [
        {
            urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
        },
    ];

    const turnHost = process.env.NEXT_PUBLIC_TURN_URL;
    const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

    if (turnHost && turnUsername && turnCredential) {
        // coturn 기본 포트: UDP/TCP 3478, TLS 5349
        servers.push({
            urls: [
                `turn:${turnHost}:3478?transport=udp`,
                `turn:${turnHost}:3478?transport=tcp`,
            ],
            username: turnUsername,
            credential: turnCredential,
        });
    }

    return servers;
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
    // Remote description 설정 전에 도착한 ICE candidate 버퍼
    const iceCandidateBuffer = useRef<RTCIceCandidateInit[]>([]);
    const isRemoteDescSetRef = useRef(false);

    useEffect(() => {
        if (!stream || !roomName) return;

        let mounted = true;

        setConnectionStatus("connecting");
        iceCandidateBuffer.current = [];
        isRemoteDescSetRef.current = false;

        if (!videoSocket.connected) {
            videoSocket.connect();
        }

        const pc = new RTCPeerConnection({ iceServers: buildIceServers() });
        peerConnectionRef.current = pc;

        // 내 트랙 추가
        stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
        });

        // 상대방 트랙 수신
        pc.ontrack = (event) => {
            if (!mounted) return;
            const [remote] = event.streams;
            if (remote) setRemoteStream(remote);
        };

        // 연결 상태 변경
        pc.onconnectionstatechange = () => {
            if (!mounted) return;
            switch (pc.connectionState) {
                case "connected":
                    setConnectionStatus("connected");
                    // 실제 사용 중인 ICE 경로 확인
                    logConnectionType(pc);
                    break;
                case "disconnected":
                case "closed":
                    setConnectionStatus("disconnected");
                    break;
                case "failed":
                    setConnectionStatus("failed");
                    // ICE restart 시도
                    handleIceRestart(pc, roomName);
                    break;
                case "connecting":
                case "new":
                    setConnectionStatus("connecting");
                    break;
            }
        };

        // ICE candidate 수집 → 서버로 전송
        pc.onicecandidate = (event) => {
            if (!mounted) return;
            if (event.candidate) {
                videoSocket.emit("ice", event.candidate, roomName);
            }
        };

        // ---------------------------------------------------------------------------
        // Remote description 설정 후 버퍼에 쌓인 ICE candidate 일괄 적용
        // ---------------------------------------------------------------------------
        const flushIceCandidateBuffer = async () => {
            if (!isRemoteDescSetRef.current) return;
            const buffered = iceCandidateBuffer.current.splice(0);
            for (const candidate of buffered) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("Error flushing ICE candidate:", e);
                }
            }
        };

        // ---------------------------------------------------------------------------
        // Signaling 핸들러
        // ---------------------------------------------------------------------------
        const createAndSendOffer = async () => {
            if (!mounted) return;
            if (pc.signalingState !== "stable") {
                console.warn(`Skipping offer: signalingState="${pc.signalingState}"`);
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
                isRemoteDescSetRef.current = true;

                const answer = await pc.createAnswer();
                if (!mounted) return;
                await pc.setLocalDescription(answer);
                videoSocket.emit("answer", answer, roomName);

                // 버퍼에 쌓인 candidate 적용
                await flushIceCandidateBuffer();
            } catch (e) {
                console.error("Error handling offer:", e);
            }
        };

        const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
            if (!mounted) return;
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                isRemoteDescSetRef.current = true;

                // 버퍼에 쌓인 candidate 적용
                await flushIceCandidateBuffer();
            } catch (e) {
                console.error("Error handling answer:", e);
            }
        };

        const handleIce = async (ice: RTCIceCandidateInit) => {
            if (!mounted) return;
            if (!isRemoteDescSetRef.current) {
                // remote description 설정 전 → 버퍼에 저장
                iceCandidateBuffer.current.push(ice);
                return;
            }
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

            videoSocket.off("welcome", createAndSendOffer);
            videoSocket.off("offer", handleOffer);
            videoSocket.off("answer", handleAnswer);
            videoSocket.off("ice", handleIce);

            pc.close();
            peerConnectionRef.current = null;
            iceCandidateBuffer.current = [];
            isRemoteDescSetRef.current = false;

            videoSocket.disconnect();
            setConnectionStatus("disconnected");
        };
    }, [stream, roomName]);

    return { remoteStream, connectionStatus };
}

// ---------------------------------------------------------------------------
// ICE restart (connectionState === "failed" 시 호출)
// ---------------------------------------------------------------------------
async function handleIceRestart(pc: RTCPeerConnection, roomName: string) {
    try {
        if (pc.signalingState !== "stable") return;
        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);
        videoSocket.emit("offer", offer, roomName);
        console.info("ICE restart offer sent");
    } catch (e) {
        console.error("ICE restart failed:", e);
    }
}

// ---------------------------------------------------------------------------
// 실제 연결 경로 확인 (TURN relay / STUN srflx / Direct)
// ---------------------------------------------------------------------------
async function logConnectionType(pc: RTCPeerConnection) {
    try {
        const stats = await pc.getStats();
        let activeCandidatePair: RTCIceCandidatePairStats | null = null;

        stats.forEach((report) => {
            if (report.type === "candidate-pair" && report.state === "succeeded" && report.nominated) {
                activeCandidatePair = report as RTCIceCandidatePairStats;
            }
        });

        if (!activeCandidatePair) return;

        const localCandidateId = (activeCandidatePair as any).localCandidateId;
        const localCandidate = stats.get(localCandidateId) as any;
        const candidateType: string = localCandidate?.candidateType ?? "unknown";

        const label: Record<string, string> = {
            relay: "...TURN...",
            srflx: "...STUN...",
            host: "...Direct...",
            prflx: "...P2P...",
        };

        console.info(
            `%c[WebRTC] ${label[candidateType] ?? `연결 타입: ${candidateType}`}`,
            "font-weight:bold; color:#4fc3f7;"
        );
    } catch (e) {
        console.warn("연결 타입 확인 실패:", e);
    }
}
