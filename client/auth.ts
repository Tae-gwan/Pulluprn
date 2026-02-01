import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export const { handlers, signIn, signOut, auth } = NextAuth({
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
            // callbackUrl이 있으면 그대로 사용
            if (url && url.startsWith(baseUrl)) {
                return url;
            }
            // 기본적으로 홈으로 리다이렉트
            return baseUrl;
        },
        async session({ session, user }) {
            if (session.user && user) {
                (session.user as any).id = user.id;
            }
            return session;
        }
    }
});