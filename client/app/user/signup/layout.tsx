import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입 - PullUpRN",
  description: "구글 계정으로 간편하게 시작하세요",
};

export default function SignupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // MainLayout 없이 직접 렌더링
  return <>{children}</>;
}
