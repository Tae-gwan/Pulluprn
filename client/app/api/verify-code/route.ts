import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { code } = await req.json();

        // 환경변수와 비교 (서버에서만 확인 가능)
        const isValid = code === process.env.TEST_ACCESS_CODE;

        return NextResponse.json({ valid: isValid });
    } catch (error) {
        return NextResponse.json({ valid: false }, { status: 400 });
    }
}
