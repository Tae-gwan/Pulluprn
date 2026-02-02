import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up - PullUpRN",
  description: "Get started easily with your Google account",
};

export default function SignupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // MainLayout 없이 직접 렌더링
  return <>{children}</>;
}
