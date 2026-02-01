"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./NavButton.module.css";
import { buttonConfig } from "../buttonConfig";

interface NavButtonProps {
  type: "friends" | "chat" | "profile";
}

export default function NavButton({ type }: NavButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [optimisticActive, setOptimisticActive] = useState(false);

  const buttonInfo = buttonConfig[type];

  // Pathname이 변경되면 낙관적 상태 초기화 (실제 네비게이션 완료 시)
  useEffect(() => {
    setOptimisticActive(false);
  }, [pathname]);

  // active 상태 확인
  const isActive = pathname.startsWith(buttonInfo.path || "") || optimisticActive;

  const handleClick = (e: React.MouseEvent) => {
    // active 상태일 때 다시 클릭하면 홈으로 이동 (취소)
    if (isActive && pathname.startsWith(buttonInfo.path || "")) {
      e.preventDefault();
      router.push('/');
      return;
    }
    // 일반 클릭: optimisticActive 설정
    setOptimisticActive(true);
  };

  return (
    <Link
      href={buttonInfo.path || "#"}
      className={styles.buttonWrapper}
      onClick={handleClick}
    >
      <div
        className={`${styles.button} ${isActive ? styles.active : ""}`}
        aria-label={buttonInfo.ariaLabel}
        style={{ color: buttonInfo.color }}
      >
        {buttonInfo.icon}
      </div>
      <span className={styles.label} style={{ color: buttonInfo.labelColor }}>
        {buttonInfo.label}
      </span>
    </Link>
  );
}
