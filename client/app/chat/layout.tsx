"use client";

import ChatLayout from '@/components/chat/ChatLayout';

export default function ChatLayoutPage({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ChatLayout>
            {children}
        </ChatLayout>
    );
}
