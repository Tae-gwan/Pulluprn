"use client";

import { useSessionContext } from "@/context/SessionContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./header.module.css";

export default function Header() {
  const { isLoggedIn } = useSessionContext();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogin = () => {
    router.push("/user/signup");
  };

  const handleSignup = () => {
    router.push("/user/signup");
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          PULLUPRN
        </Link>

        <nav className={styles.nav}>
          {!isLoggedIn && pathname !== "/" ? (
            <>
              <button onClick={handleLogin} className={styles.loginButton}>
                LOGIN
              </button>
              <button onClick={handleSignup} className={styles.signupButton}>
                SIGN UP
              </button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
