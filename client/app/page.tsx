"use client";

import React from 'react';
import { useSessionContext } from "@/context/SessionContext";
import styles from './page.module.css';

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { status } = useSessionContext();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [submissionStatus, setSubmissionStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");
  const [isAccessGranted, setIsAccessGranted] = React.useState(false);

  const isLoading = status === "loading";

  // 로딩 중일 때만 아무것도 표시하지 않음
  if (isLoading) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // [SECRET CODE CHECK - Server Side]
    try {
      const verifyRes = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: email }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.valid) {
        setIsAccessGranted(true);
        setMessage("Access Granted! Welcome.");
        setSubmissionStatus("success");
        return;
      }
    } catch (e) {
      // 검증 에러 시 Waitlist 로직으로 계속 진행
    }

    setSubmissionStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmissionStatus("success");
        setMessage(data.message);
        setEmail("");
      } else {
        setSubmissionStatus("error");
        setMessage(data.message || "Something went wrong.");
      }
    } catch (error) {
      setSubmissionStatus("error");
      setMessage("Failed to connect to the server.");
    }
  };

  return (
    <div className={styles.main}>
      <h1 className={styles.title}>PULLUPRN</h1>
      <p className={styles.subtitle}>Browse the web together, face to face, from anywhere</p>

      {/* ACCESS GRANTED: Show Login/Signup Buttons */}
      {isAccessGranted ? (
        <div className={styles.form}>
          <p className={styles.subtitle} style={{ marginBottom: '1rem', color: '#ff703c' }}>
            Access Granted
          </p>
          <button
            className={styles.button}
            onClick={() => router.push("/user/signup")}
          >
            Enter Service (Login / Sign Up)
          </button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          {(submissionStatus === "idle" || submissionStatus === "error") && (
            <>
              <input
                type="email"
                className={styles.input}
                placeholder="Enter your email for updates"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className={styles.button}
              >
                Join the Waitlist
              </button>
            </>
          )}

          {message && (
            <p className={`${styles.message} ${submissionStatus === "success" ? styles.success : styles.error}`}>
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}