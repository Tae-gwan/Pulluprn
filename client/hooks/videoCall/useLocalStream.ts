import { useEffect, useRef, useState, useCallback } from "react";

export function useLocalStream() {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    // 마이크 볼륨 조절용 Web Audio API
    const [micVolume, setMicVolume] = useState(1); // 0 ~ 1
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const processedStreamRef = useRef<MediaStream | null>(null);
    // 현재 활성화된 원본 마이크 트랙 (startStream 또는 switchDevice로 획득)
    const rawAudioTrackRef = useRef<MediaStreamTrack | null>(null);

    // 로컬 미디어 스트림 시작
    const startStream = useCallback(async () => {
        if (stream) return;

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            // Web Audio API로 마이크 볼륨 제어 파이프라인 구성
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(mediaStream);
            const gainNode = audioContext.createGain();
            const destination = audioContext.createMediaStreamDestination();

            source.connect(gainNode);
            gainNode.connect(destination);
            gainNode.gain.value = 1;

            audioContextRef.current = audioContext;
            gainNodeRef.current = gainNode;

            // 원본 오디오 트랙 저장
            const audioTrack = mediaStream.getAudioTracks()[0];
            if (audioTrack) {
                rawAudioTrackRef.current = audioTrack;
            }

            // 원본 비디오 트랙 + GainNode를 거친 오디오 트랙으로 새 스트림 생성
            const processedStream = new MediaStream();
            mediaStream.getVideoTracks().forEach(track => processedStream.addTrack(track));
            destination.stream.getAudioTracks().forEach(track => processedStream.addTrack(track));

            processedStreamRef.current = processedStream;
            setStream(processedStream);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e : new Error("Failed to get media stream"));
            alert("Camera and microphone permission is required.");
        }
    }, [stream]);

    // 마이크 볼륨 변경
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
        // 원본 마이크 트랙도 같이 토글 (하드웨어 인디케이터 반영용)
        if (rawAudioTrackRef.current) {
            rawAudioTrackRef.current.enabled = !rawAudioTrackRef.current.enabled;
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
        // 가공된 스트림 트랙 정리 (비디오 + 가공된 오디오)
        // ref 기반으로 정리하여 클로저 문제 방지
        if (processedStreamRef.current) {
            processedStreamRef.current.getTracks().forEach(track => track.stop());
            processedStreamRef.current = null;
        }
        // state의 stream도 정리 (혹시 다른 참조가 있을 경우 대비)
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        // 원본 마이크 트랙 정리
        if (rawAudioTrackRef.current) {
            rawAudioTrackRef.current.stop();
            rawAudioTrackRef.current = null;
        }
        // AudioContext 닫기
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        // GainNode 참조 정리
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
                // 오디오: GainNode 파이프라인 재구성

                // 이전 원본 마이크 트랙 정지
                if (rawAudioTrackRef.current) {
                    rawAudioTrackRef.current.stop();
                }

                // 이전 AudioContext 정리
                if (audioContextRef.current) {
                    await audioContextRef.current.close();
                }

                const audioContext = new AudioContext();
                const source = audioContext.createMediaStreamSource(new MediaStream([newTrack]));
                const gainNode = audioContext.createGain();
                const destination = audioContext.createMediaStreamDestination();

                source.connect(gainNode);
                gainNode.connect(destination);
                gainNode.gain.value = micVolume;

                audioContextRef.current = audioContext;
                gainNodeRef.current = gainNode;

                // 새 원본 마이크 트랙 저장
                rawAudioTrackRef.current = newTrack;

                const oldAudioTrack = stream.getAudioTracks()[0];
                if (oldAudioTrack) {
                    oldAudioTrack.stop();
                    stream.removeTrack(oldAudioTrack);
                }
                const processedTrack = destination.stream.getAudioTracks()[0];
                stream.addTrack(processedTrack);
                processedTrack.enabled = isAudioEnabled;
            }

            // 스트림 갱신 트리거
            setStream(stream);
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
