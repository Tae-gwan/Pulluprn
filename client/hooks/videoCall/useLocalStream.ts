import { useEffect, useRef, useState, useCallback } from "react";

export function useLocalStream() {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    // 마이크 볼륨 조절용 Web Audio API (로컬 모니터링 전용 - WebRTC 송출과 분리)
    const [micVolume, setMicVolume] = useState(1); // 0 ~ 1
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    // 로컬 미디어 스트림 시작
    const startStream = useCallback(async () => {
        if (stream) return;

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            // Web Audio API 파이프라인을 별도로 구성 (로컬 볼륨 모니터링/조절 전용)
            // 이 파이프라인은 WebRTC 송출에는 사용하지 않음
            const audioContext = new AudioContext();
            if (audioContext.state === "suspended") {
                audioContext.resume().catch(e => console.warn("AudioContext resume failed:", e));
            }
            const source = audioContext.createMediaStreamSource(mediaStream);
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 1;
            // destination은 연결하지 않음 (로컬 모니터링 전용)
            source.connect(gainNode);

            audioContextRef.current = audioContext;
            gainNodeRef.current = gainNode;

            // WebRTC에는 원본 스트림(원본 마이크 트랙 포함)을 그대로 사용
            setStream(mediaStream);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e : new Error("Failed to get media stream"));
            alert("Camera and microphone permission is required.");
        }
    }, [stream]);

    // 마이크 볼륨 변경 (GainNode 조절)
    const changeMicVolume = useCallback((volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        setMicVolume(clampedVolume);
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = clampedVolume;
        }
    }, []);

    // 오디오 토글
    const toggleAudio = useCallback(() => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    }, [stream]);

    // 비디오 토글
    const toggleVideo = useCallback(() => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    }, [stream]);

    // 스트림 즉시 정리 (통화 종료 시 호출)
    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        // AudioContext 닫기
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        gainNodeRef.current = null;
        setStream(null);
    }, [stream]);

    // 장치 변경 (오디오 입력 또는 비디오 입력)
    const switchDevice = useCallback(async (kind: "audioinput" | "videoinput", deviceId: string) => {
        if (!stream) return;

        try {
            const constraints: MediaStreamConstraints = kind === "audioinput"
                ? { audio: { deviceId: { exact: deviceId } }, video: false }
                : { audio: false, video: { deviceId: { exact: deviceId } } };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const newTrack = newStream.getTracks()[0];

            if (kind === "videoinput") {
                const oldVideoTrack = stream.getVideoTracks()[0];
                if (oldVideoTrack) {
                    oldVideoTrack.stop();
                    stream.removeTrack(oldVideoTrack);
                }
                stream.addTrack(newTrack);
                newTrack.enabled = isVideoEnabled;
            } else {
                // 오디오: 이전 AudioContext 정리 후 새로 구성
                if (audioContextRef.current && audioContextRef.current.state !== "closed") {
                    await audioContextRef.current.close();
                }

                const audioContext = new AudioContext();
                if (audioContext.state === "suspended") {
                    audioContext.resume().catch(e => console.warn("AudioContext resume failed:", e));
                }
                const source = audioContext.createMediaStreamSource(new MediaStream([newTrack]));
                const gainNode = audioContext.createGain();
                gainNode.gain.value = micVolume;
                source.connect(gainNode);

                audioContextRef.current = audioContext;
                gainNodeRef.current = gainNode;

                // 이전 마이크 트랙 제거 후 새 원본 트랙 직접 추가 (WebRTC에 원본 트랙 전달)
                const oldAudioTrack = stream.getAudioTracks()[0];
                if (oldAudioTrack) {
                    oldAudioTrack.stop();
                    stream.removeTrack(oldAudioTrack);
                }
                stream.addTrack(newTrack);
                newTrack.enabled = isAudioEnabled;
            }

            // 스트림 갱신 트리거
            setStream(new MediaStream(stream.getTracks()));
        } catch (e) {
            console.error("Failed to switch device:", e);
        }
    }, [stream, micVolume, isAudioEnabled, isVideoEnabled]);

    // 컴포넌트 언마운트 시 트랙 정리
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
            if (audioContextRef.current && audioContextRef.current.state !== "closed") {
                audioContextRef.current.close();
            }
        };
    }, [stream]);

    return {
        stream, error, startStream, stopStream,
        isAudioEnabled, isVideoEnabled,
        toggleAudio, toggleVideo,
        micVolume, changeMicVolume,
        switchDevice,
    };
}
