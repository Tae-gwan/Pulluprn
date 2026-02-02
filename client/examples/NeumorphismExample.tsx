"use client";

import React, { useState } from 'react';
import styles from './neumorphism-example.module.css';

export default function NeumorphismExample() {
  const [toggleActive, setToggleActive] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [activeSegment, setActiveSegment] = useState(0);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 style={{ marginBottom: '32px', color: '#333' }}>Neumorphism UI Example</h1>

        {/* 버튼들 */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <button className={styles.raisedButton}>Raised Button</button>
          <button className={styles.pressedButton}>Pressed Button</button>
          <button className={styles.orangeButton}>Orange Button</button>
        </div>

        {/* 토글 스위치 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '12px', color: '#333' }}>Toggle Switch</h3>
          <div 
            className={`${styles.toggleSwitch} ${toggleActive ? styles.active : ''}`}
            onClick={() => setToggleActive(!toggleActive)}
          />
        </div>

        {/* 체크박스 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '12px', color: '#333' }}>Checkbox</h3>
          <div 
            className={`${styles.checkbox} ${checkboxChecked ? styles.checked : ''}`}
            onClick={() => setCheckboxChecked(!checkboxChecked)}
          />
        </div>

        {/* 입력 필드 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '12px', color: '#333' }}>Input Field</h3>
          <input 
            type="text" 
            className={styles.inputField} 
            placeholder="Search..."
          />
        </div>

        {/* 슬라이더 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '12px', color: '#333' }}>Slider: {sliderValue}%</h3>
          <div className={styles.sliderContainer}>
            <div 
              className={styles.sliderTrack} 
              style={{ width: `${sliderValue}%` }}
            />
            <div 
              className={styles.sliderThumb}
              style={{ left: `calc(${sliderValue}% - 10px)` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            style={{ width: '100%', maxWidth: '300px', marginTop: '8px' }}
          />
        </div>

        {/* 세그먼트 버튼 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '12px', color: '#333' }}>Segment Buttons</h3>
          <div className={styles.segmentContainer}>
            <button
              className={`${styles.segmentButton} ${activeSegment === 0 ? styles.active : ''}`}
              onClick={() => setActiveSegment(0)}
            >
              Option 1
            </button>
            <button
              className={`${styles.segmentButton} ${activeSegment === 1 ? styles.active : ''}`}
              onClick={() => setActiveSegment(1)}
            >
              Option 2
            </button>
            <button
              className={`${styles.segmentButton} ${activeSegment === 2 ? styles.active : ''}`}
              onClick={() => setActiveSegment(2)}
            >
              Option 3
            </button>
          </div>
        </div>

        {/* 원형 다이얼 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '12px', color: '#333' }}>Circular Dial</h3>
          <div className={styles.circularDial} />
        </div>
      </div>
    </div>
  );
}
