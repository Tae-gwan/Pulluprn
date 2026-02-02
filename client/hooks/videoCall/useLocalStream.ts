import { useEffect, useRef, useState, useCallback } from "react";

export function useLocalStream() {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<Error | null>(null);

    // 로컬 미디어 스트림 시작
    const startStream = useCallback(async () => {
        if (stream) return; // 이미 스트림이 있으면 스킵

        try {
            // navigator는 브라우저가 전역으로 제공하는 객체
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            setStream(mediaStream);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e : new Error("Failed to get media stream"));
            alert("Camera and microphone permission is required.");
        }
    }, [stream]);

    // 컴포넌트 언마운트 시 트랙 정리
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [stream]);

    return { stream, error, startStream };
}
