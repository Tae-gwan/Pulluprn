'use client';

import React, { useState } from 'react';
import styles from './FloatingControlBar.module.css';
import { ConnectionStatus } from '@/hooks/videoCall/useWebRTC';
import { MediaDeviceOption } from '@/hooks/videoCall/useMediaDevices';
import DeviceSettingsPanel from './DeviceSettingsPanel';

interface FloatingControlBarProps {
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    toggleAudio: () => void;
    toggleVideo: () => void;
    endCall: () => void;
    // 볼륨 제어
    micVolume: number;
    changeMicVolume: (volume: number) => void;
    remoteVolume: number;
    changeRemoteVolume: (volume: number) => void;
    // 연결 상태
    connectionStatus: ConnectionStatus;
    // 통화 시간
    callDuration: number;
    // 전체화면
    isFullscreen: boolean;
    toggleFullscreen: () => void;
    // 장치 선택
    audioInputs: MediaDeviceOption[];
    audioOutputs: MediaDeviceOption[];
    videoInputs: MediaDeviceOption[];
    selectedAudioInput: string;
    selectedAudioOutput: string;
    selectedVideoInput: string;
    onDeviceChange: (kind: "audioinput" | "audiooutput" | "videoinput", deviceId: string) => void;
    // 브라우저 공유
    isBrowserOpen: boolean;
    toggleBrowser: () => void;
}

const FloatingControlBar: React.FC<FloatingControlBarProps> = ({
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    endCall,
    remoteVolume,
    changeRemoteVolume,
    isFullscreen,
    toggleFullscreen,
    audioInputs,
    audioOutputs,
    videoInputs,
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,
    onDeviceChange,
    isBrowserOpen,
    toggleBrowser,
}) => {
    const [showSettings, setShowSettings] = useState(false);
    const isSpeakerOn = remoteVolume > 0;

    const toggleSpeaker = () => {
        changeRemoteVolume(isSpeakerOn ? 0 : 1);
    };

    return (
        <div className={styles.controlSection}>
            <div className={styles.controlsRow}>
                {/* 마이크 on/off */}
                <div className={styles.buttonWrapper}>
                    <button
                        className={`${styles.button} ${!isAudioEnabled ? styles.buttonActive : ''}`}
                        onClick={toggleAudio}
                        title={isAudioEnabled ? 'Mute' : 'Unmute'}
                    >
                        {isAudioEnabled ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c19787" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.5-.35 2.18"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        )}
                    </button>
                </div>

                {/* 카메라 on/off */}
                <div className={styles.buttonWrapper}>
                    <button
                        className={`${styles.button} ${!isVideoEnabled ? styles.buttonActive : ''}`}
                        onClick={toggleVideo}
                        title={isVideoEnabled ? 'Camera Off' : 'Camera On'}
                    >
                        {isVideoEnabled ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c19787" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        )}
                    </button>
                </div>

                {/* 스피커 on/off */}
                <div className={styles.buttonWrapper}>
                    <button
                        className={`${styles.button} ${!isSpeakerOn ? styles.buttonActive : ''}`}
                        onClick={toggleSpeaker}
                        title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
                    >
                        {isSpeakerOn ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c19787" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <line x1="23" y1="9" x2="17" y2="15"></line>
                                <line x1="17" y1="9" x2="23" y2="15"></line>
                            </svg>
                        )}
                    </button>
                </div>

                {/* 전체화면 */}
                <div className={styles.buttonWrapper}>
                    <button
                        className={`${styles.button} ${isFullscreen ? styles.buttonActive : ''}`}
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                        {isFullscreen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c19787" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="4 14 10 14 10 20"></polyline>
                                <polyline points="20 10 14 10 14 4"></polyline>
                                <line x1="14" y1="10" x2="21" y2="3"></line>
                                <line x1="3" y1="21" x2="10" y2="14"></line>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <polyline points="9 21 3 21 3 15"></polyline>
                                <line x1="21" y1="3" x2="14" y2="10"></line>
                                <line x1="3" y1="21" x2="10" y2="14"></line>
                            </svg>
                        )}
                    </button>
                </div>

                {/* 브라우저 공유 */}
                <div className={styles.buttonWrapper}>
                    <button
                        className={`${styles.button} ${isBrowserOpen ? styles.buttonActive : ''}`}
                        onClick={toggleBrowser}
                        title={isBrowserOpen ? 'Close Browser' : 'Open Browser'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isBrowserOpen ? '#FF6B35' : '#c19787'} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                    </button>
                </div>

                {/* 환경설정 */}
                <div className={styles.buttonWrapper}>
                    <button
                        className={`${styles.button} ${showSettings ? styles.buttonActive : ''}`}
                        onClick={() => setShowSettings(prev => !prev)}
                        title="Settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={showSettings ? 'currentColor' : '#FF6B35'} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                    </button>
                </div>

                {/* 통화 종료 */}
                <div className={styles.buttonWrapper}>
                    <button
                        className={`${styles.button} ${styles.endButton}`}
                        onClick={endCall}
                        title="End Call"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4z"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* 장치 설정 패널 */}
            <DeviceSettingsPanel
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                audioInputs={audioInputs}
                audioOutputs={audioOutputs}
                videoInputs={videoInputs}
                selectedAudioInput={selectedAudioInput}
                selectedAudioOutput={selectedAudioOutput}
                selectedVideoInput={selectedVideoInput}
                onDeviceChange={onDeviceChange}
            />
        </div>
    );
};

export default FloatingControlBar;
