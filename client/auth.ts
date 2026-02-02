import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

// 프로덕션에서 AUTH_SECRET 없으면 Auth.js가 500 냄 → 시작 시점에 검사
if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET?.trim()) {
    throw new Error(
        "AUTH_SECRET is missing or empty. Add AUTH_SECRET to .env in the project root (e.g. run: openssl rand -base64 32) and restart the client container."
    );
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export const { handlers, signIn, signOut, auth } = NextAuth({
    secret: process.env.AUTH_SECRET,
    adapter: PrismaAdapter(prisma),
    providers: [Google],
    pages: {
        signIn: "/user/signup",
    },
    callbacks: {
        async authorized({ request, auth }) {
            return true;
        },
        async redirect({ url, baseUrl }) {
            // NEXTAUTH_URL을 명시적으로 사용
            const nextAuthUrl = process.env.NEXTAUTH_URL || baseUrl;
            
            // callbackUrl이 있으면 그대로 사용
            if (url && url.startsWith(nextAuthUrl)) {
                return url;
            }
            // 기본적으로 홈으로 리다이렉트
            return nextAuthUrl;
        },
        async session({ session, user }) {
            if (session.user && user) {
                (session.user as any).id = user.id;
            }
            return session;
        }
    }
});