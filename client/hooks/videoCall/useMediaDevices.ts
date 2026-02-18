import { useEffect, useState, useCallback } from "react";

export interface MediaDeviceOption {
    deviceId: string;
    label: string;
    kind: MediaDeviceKind;
}

export function useMediaDevices() {
    const [audioInputs, setAudioInputs] = useState<MediaDeviceOption[]>([]);
    const [audioOutputs, setAudioOutputs] = useState<MediaDeviceOption[]>([]);
    const [videoInputs, setVideoInputs] = useState<MediaDeviceOption[]>([]);

    const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
    const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");
    const [selectedVideoInput, setSelectedVideoInput] = useState<string>("");

    const enumerateDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            const audioIn = devices
                .filter(d => d.kind === "audioinput")
                .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 5)}`, kind: d.kind }));

            const audioOut = devices
                .filter(d => d.kind === "audiooutput")
                .map(d => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 5)}`, kind: d.kind }));

            const videoIn = devices
                .filter(d => d.kind === "videoinput")
                .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 5)}`, kind: d.kind }));

            setAudioInputs(audioIn);
            setAudioOutputs(audioOut);
            setVideoInputs(videoIn);

            // 기본 선택 (첫 번째 장치)
            if (!selectedAudioInput && audioIn.length > 0) setSelectedAudioInput(audioIn[0].deviceId);
            if (!selectedAudioOutput && audioOut.length > 0) setSelectedAudioOutput(audioOut[0].deviceId);
            if (!selectedVideoInput && videoIn.length > 0) setSelectedVideoInput(videoIn[0].deviceId);
        } catch (e) {
            console.error("Failed to enumerate devices:", e);
        }
    }, [selectedAudioInput, selectedAudioOutput, selectedVideoInput]);

    // 장치 변경 감지
    useEffect(() => {
        enumerateDevices();

        navigator.mediaDevices.addEventListener("devicechange", enumerateDevices);
        return () => {
            navigator.mediaDevices.removeEventListener("devicechange", enumerateDevices);
        };
    }, [enumerateDevices]);

    return {
        audioInputs,
        audioOutputs,
        videoInputs,
        selectedAudioInput,
        selectedAudioOutput,
        selectedVideoInput,
        setSelectedAudioInput,
        setSelectedAudioOutput,
        setSelectedVideoInput,
    };
}
