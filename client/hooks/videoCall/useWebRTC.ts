import { useEffect, useRef, useState } from "react";
import { videoSocket } from "./videoSocket";

const rtcConfig: RTCConfiguration = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
        },
    ],
};

interface UseWebRTCProps {
    stream: MediaStream | null;
    roomName: string | null;
}

export function useWebRTC({ stream, roomName }: UseWebRTCProps) {
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        // MediaStream과 RoomName이 모두 준비되어야 시작
        if (!stream || !roomName) return;

        // 소켓 연결
        if (!videoSocket.connected) {
            videoSocket.connect();
        }

        // PeerConnection 생성
        const pc = new RTCPeerConnection(rtcConfig);
        peerConnectionRef.current = pc;

        // 내 트랙 추가
        //stream.getTracks()는 MediaStreamTrack[]를 반환
        stream.getTracks().forEach((track) => {
            //Offer 생성 시 내 트랙 추가
            pc.addTrack(track, stream);
        });

        // 상대방 트랙 수신 했을 때 실행되는 이벤트 핸들러
        // 브라우저 내부 ICE Agent가 상대방 트랙을 수신했을 때 실행됨
        pc.ontrack = (event) => {
            const [remote] = event.streams;
            if (remote) {
                setRemoteStream(remote);
            }
        };

        // 브라우저가 ICE Candidate를 수집할 때마다 실행되는 이벤트 핸들러
        // setLocalDescription 후에 실행됨
        // ICE Candidate를 서버로 전송
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                videoSocket.emit("ice", event.candidate, roomName);
            }
        };

        // --- Signaling Event Handlers ---

        // 서버로부터 Welcome 수신 시(누군가 입장 시)Offer를 전송하는 콜백함수
        const createAndSendOffer = async () => {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                videoSocket.emit("offer", offer, roomName);
            } catch (e) {
                console.error("Error creating offer:", e);
            }
        };

        // Offer 수신 후 Answer를 전송하는 콜백함수
        const handleOffer = async (offer: RTCSessionDescriptionInit) => {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                videoSocket.emit("answer", answer, roomName);
            } catch (e) {
                console.error("Error handling offer:", e);
            }
        };

        // 3) Answer 수신
        const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (e) {
                console.error("Error handling answer:", e);
            }
        };

        // ICE Candidate 수신 후 브라우저에 등록
        const handleIce = async (ice: RTCIceCandidateInit) => {
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
            videoSocket.off("welcome", createAndSendOffer);
            videoSocket.off("offer", handleOffer);
            videoSocket.off("answer", handleAnswer);
            videoSocket.off("ice", handleIce);

            pc.close();
            peerConnectionRef.current = null;

            // Hook이 언마운트되거나 roomName이 바뀔 때 disconnect (선택 사항)
            // 여기서는 명시적으로 disconnect 해주는 것이 안전함
            videoSocket.disconnect();
        };
    }, [stream, roomName]);

    return { remoteStream };
}
