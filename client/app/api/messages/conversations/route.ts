import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 현재 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 내가 속한 모든 ChatRoom 조회
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { user1Id: user.id },
          { user2Id: user.id },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // 마지막 메시지만 가져오기
        },
      },
      orderBy: {
        lastMessageAt: "desc", // 최신 대화순으로 정렬
      },
    });

    // 대화 목록 구성 (대화한 사람만)
    const conversations = chatRooms.map((room) => {
      // 상대방 정보 가져오기
      const friend = room.user1Id === user.id ? room.user2 : room.user1;
      const lastMessage = room.messages[0] || null;

      // 읽지 않은 메시지 수 계산
      // TODO: 현재 스키마에 읽음 상태 필드가 없으므로 0으로 설정
      // 나중에 Message 모델에 isRead 필드를 추가하면 여기서 계산 가능
      const unreadCount = 0;

      return {
        friend: {
          id: friend.id,
          name: friend.name,
          image: friend.image,
          status: "offline" as const, // TODO: 실제 온라인 상태 확인 로직 추가
        },
        lastMessage: lastMessage
          ? {
            text: lastMessage.text,
            timestamp: lastMessage.createdAt.getTime(),
          }
          : null,
        unreadCount,
        chatRoomId: room.id,
      };
    });

    // 마지막 메시지 시간 기준으로 정렬 (최신순)
    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return timeB - timeA;
    });

    return NextResponse.json({
      conversations,
    });
  } catch (error) {
    console.error("대화 목록 가져오기 실패:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
