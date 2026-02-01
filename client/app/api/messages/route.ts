import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET: 특정 채팅방의 이전 메시지 조회
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const friendId = searchParams.get('friendId');
        const limit = parseInt(searchParams.get('limit') || '100');
        const cursor = searchParams.get('cursor'); // 페이징용

        if (!friendId) {
            return NextResponse.json({ error: 'friendId is required' }, { status: 400 });
        }

        // 현재 사용자 찾기
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 메시지 필터 조건 (페이징)
        const messageWhere: any = {};
        if (cursor) {
            messageWhere.createdAt = { lt: new Date(cursor) };
        }

        // ChatRoom을 찾으면서 메시지도 함께 가져오기
        const chatRoom = await prisma.chatRoom.findFirst({
            where: {
                OR: [
                    { user1Id: currentUser.id, user2Id: friendId },
                    { user1Id: friendId, user2Id: currentUser.id }
                ]
            },
            include: {
                messages: {
                    where: messageWhere,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        receiver: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: limit + 1 // 하나 더 가져와서 다음 페이지 여부 확인
                }
            }
        });

        if (!chatRoom) {
            // 채팅방이 없으면 빈 배열 반환
            return NextResponse.json({ messages: [], nextCursor: null });
        }

        const messages = chatRoom.messages;

        const hasMore = messages.length > limit;
        const messagesToReturn = hasMore ? messages.slice(0, limit) : messages;
        const nextCursor = hasMore && messagesToReturn.length > 0
            ? messagesToReturn[messagesToReturn.length - 1].createdAt.toISOString()
            : null;

        // 시간순으로 정렬 (오래된 것부터)
        const sortedMessages = messagesToReturn.reverse().map(msg => ({
            id: msg.id,
            text: msg.text,
            type: msg.senderId === currentUser.id ? 'my' : 'other',
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            username: msg.sender.name || 'Unknown',
            timestamp: msg.createdAt.getTime(),
            createdAt: msg.createdAt.toISOString()
        }));

        return NextResponse.json({
            messages: sortedMessages,
            nextCursor
        });
    } catch (error) {
        console.error('메시지 조회 오류:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
