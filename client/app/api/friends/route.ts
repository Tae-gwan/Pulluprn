import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    //NextAuth로 세션 확인
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //prisma를 통해 접속한 세션의 유저를 찾음
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 모든 친구 관계 및 요청을 한 번에 가져오기
    const allFriendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id },
        ],
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true },
        },
        receiver: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    const friends: any[] = [];
    const pendingSent: any[] = [];
    const pendingReceived: any[] = [];

    // 메모리 상에서 분류
    allFriendships.forEach((friendship) => {
      if (friendship.status === "ACCEPTED") {
        const friend =
          friendship.senderId === user.id
            ? friendship.receiver
            : friendship.sender;

        friends.push({
          id: friend.id,
          name: friend.name,
          email: friend.email,
          image: friend.image,
          status: "offline", // TODO: 실제 온라인 상태 확인 로직 추가
        });
      } else if (friendship.status === "PENDING") {
        if (friendship.senderId === user.id) {
          // 내가 보낸 요청
          pendingSent.push({
            id: friendship.receiver.id,
            name: friendship.receiver.name,
            email: friendship.receiver.email,
            image: friendship.receiver.image,
            friendshipId: friendship.id,
          });
        } else {
          // 내가 받은 요청
          pendingReceived.push({
            id: friendship.sender.id,
            name: friendship.sender.name,
            email: friendship.sender.email,
            image: friendship.sender.image,
            friendshipId: friendship.id,
          });
        }
      }
    });

    return NextResponse.json({
      friends,
      pendingSent,
      pendingReceived,
    });
  } catch (error) {
    console.error("친구 목록 가져오기 실패:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



