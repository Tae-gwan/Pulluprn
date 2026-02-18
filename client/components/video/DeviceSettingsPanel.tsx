'use client';

import React from 'react';
import styles from './DeviceSettingsPanel.module.css';
import { MediaDeviceOption } from '@/hooks/videoCall/useMediaDevices';

interface DeviceSettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    audioInputs: MediaDeviceOption[];
    audioOutputs: MediaDeviceOption[];
    videoInputs: MediaDeviceOption[];
    selectedAudioInput: string;
    selectedAudioOutput: string;
    selectedVideoInput: string;
    onDeviceChange: (kind: "audioinput" | "audiooutput" | "videoinput", deviceId: string) => void;
}

const DeviceSettingsPanel: React.FC<DeviceSettingsPanelProps> = ({
    isOpen,
    onClose,
    audioInputs,
    audioOutputs,
    videoInputs,
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,
    onDeviceChange,
}) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className={styles.header}>
                    <h3 className={styles.title}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Settings
                    </h3>
                    <button className={styles.closeButton} onClick={onClose}>✕</button>
                </div>

                {/* 마이크 선택 */}
                <div className={styles.deviceGroup}>
                    <label className={styles.label}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                        Microphone
                    </label>
                    <select
                        className={styles.select}
                        value={selectedAudioInput}
                        onChange={(e) => onDeviceChange("audioinput", e.target.value)}
                    >
                        {audioInputs.map(d => (
                            <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                        ))}
                    </select>
                </div>

                {/* 스피커 선택 */}
                <div className={styles.deviceGroup}>
                    <label className={styles.label}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                        </svg>
                        Speaker
                    </label>
                    <select
                        className={styles.select}
                        value={selectedAudioOutput}
                        onChange={(e) => onDeviceChange("audiooutput", e.target.value)}
                    >
                        {audioOutputs.map(d => (
                            <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                        ))}
                    </select>
                </div>

                {/* 카메라 선택 */}
                <div className={styles.deviceGroup}>
                    <label className={styles.label}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                        </svg>
                        Camera
                    </label>
                    <select
                        className={styles.select}
                        value={selectedVideoInput}
                        onChange={(e) => onDeviceChange("videoinput", e.target.value)}
                    >
                        {videoInputs.map(d => (
                            <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default DeviceSettingsPanel;
