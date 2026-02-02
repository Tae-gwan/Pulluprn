import io from "socket.io-client";

// 영상통화용 시그널링 소켓 (별도 서버: videocall.js, 포트 3002)
// 싱글톤으로 관리하여 훅이 리렌더링되어도 연결이 끊기지 않도록 함
export const videoSocket = io(process.env.NEXT_PUBLIC_VIDEO_SOCKET_URL || "http://localhost:3002", {
    path: "/videocall/socket.io", // 채팅(3001)과 구분해 Nginx가 3002로 프록시하도록
    autoConnect: false, // 필요할 때 connect() 호출
});
