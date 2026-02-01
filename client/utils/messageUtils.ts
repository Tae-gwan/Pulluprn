import type { Message } from '@/types/message';

/**
 * 메시지를 시간 순서대로 정렬
 */
export function sortMessagesByTimestamp(messages: Message[]): Message[] {
    return [...messages].sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * 메시지에 이름을 표시할지 여부를 결정
 * @param message 현재 메시지
 * @param prevMessage 이전 메시지
 * @returns 이름을 표시해야 하면 true
 */
export function shouldShowName(message: Message, prevMessage: Message | null): boolean {
    // 내 메시지는 이름 표시 안 함
    if (message.type === 'my') {
        return false;
    }

    // 이전 메시지가 없으면 표시
    if (!prevMessage) {
        return true;
    }

    // 이전 메시지가 내 메시지면 표시
    if (prevMessage.type === 'my') {
        return true;
    }

    // 이전 메시지와 다른 사용자면 표시
    if (prevMessage.username !== message.username) {
        return true;
    }

    return false;
}
