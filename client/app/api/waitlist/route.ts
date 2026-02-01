import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json(
                { message: "유효한 이메일 주소를 입력해주세요." },
                { status: 400 }
            );
        }

        // 이미 존재하는지 확인
        const existingEntry = await prisma.waitlist.findUnique({
            where: { email },
        });

        if (existingEntry) {
            // 이미 등록되어 있어도 성공으로 처리
            return NextResponse.json(
                { message: "You are already on the waitlist!" },
                { status: 200 }
            );
        }

        await prisma.waitlist.create({
            data: {
                email,
            },
        });

        return NextResponse.json(
            { message: "Thanks for your interest! We'll email you later." },
            { status: 201 }
        );
    } catch (error) {
        console.error("Subscription error:", error);
        // 더 자세한 에러 정보 로깅
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        return NextResponse.json(
            { 
                message: "서버 오류가 발생했습니다. 나중에 다시 시도해주세요.",
                error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
            },
            { status: 500 }
        );
    }
}
