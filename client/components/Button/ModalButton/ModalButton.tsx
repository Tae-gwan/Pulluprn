"use client";

import { useState, memo } from "react";
import { signOut } from "next-auth/react";
import { useSessionContext } from "@/context/SessionContext";
import styles from "./ModalButton.module.css";
import { buttonConfig } from "../buttonConfig";

interface ModalButtonProps {
  type: "logout";
}

const ModalButton = memo(function ModalButton({ type }: ModalButtonProps) {
  const { isLoggedIn } = useSessionContext();
  const [isOpen, setIsOpen] = useState(false);

  const buttonInfo = buttonConfig[type];

  // Logout 버튼이고 로그인하지 않은 경우 렌더링하지 않음
  if (!isLoggedIn) {
    return null;
  }

  // Logout 처리 (토글)
  const handleClick = () => {
    setIsOpen(prev => !prev);
  };

  const handleConfirm = async () => {
    setIsOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className={styles.buttonWrapper}>
        <button
          className={`${styles.button} ${isOpen ? styles.active : ""}`}
          onClick={handleClick}
          aria-label={buttonInfo.ariaLabel}
          style={{ color: buttonInfo.color }}
        >
          {buttonInfo.icon}
        </button>
        <span className={styles.label} style={{ color: buttonInfo.labelColor }}>
          {buttonInfo.label}
        </span>
      </div>

      {isOpen && (
        <div className={styles.overlay} onClick={handleCancel}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={handleCancel} aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h3 className={styles.title}>Logout</h3>
            <p className={styles.message}>Are you sure you want to log out?</p>
            <div className={styles.buttons}>
              <button className={styles.cancelButton} onClick={handleCancel}>
                Cancel
              </button>
              <button className={styles.confirmButton} onClick={handleConfirm}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default ModalButton;
