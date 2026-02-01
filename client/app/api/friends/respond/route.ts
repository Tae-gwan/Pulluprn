import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { friendshipId, action } = await request.json();

    if (!friendshipId || !action) {
      return NextResponse.json(
        { error: "Friendship ID and action are required" },
        { status: 400 }
      );
    }

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json(
        { error: "Action must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    // 친구 요청 찾기
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Friendship request not found" },
        { status: 404 }
      );
    }

    // 받은 요청인지 확인
    if (friendship.receiverId !== user.id) {
      return NextResponse.json(
        { error: "You can only respond to requests you received" },
        { status: 403 }
      );
    }

    // 이미 처리된 요청인지 확인
    if (friendship.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request already processed" },
        { status: 400 }
      );
    }

    // 요청 수락 또는 거절
    await prisma.friendship.update({
      where: { id: friendshipId },
      data: {
        status: action === "accept" ? "ACCEPTED" : "DECLINED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("요청 처리 실패:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



