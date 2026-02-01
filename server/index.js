const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
// Express 앱을 HTTP 서버로 감싸야 Socket.io를 붙일 수 있습니다.
const server = http.createServer(app);

// Socket.io 설정 (CORS 허용)
const io = new Server(server, {
  cors: {
    origin: "*", // 모든 주소에서 접속 허용 (보안상 나중에는 프론트엔드 주소로 변경 권장)
    methods: ["GET", "POST"],
  },
});

// 우리가 정한 입장 비밀번호
const ROOM_PASSWORD = "1234";

// 클라이언트가 접속했을 때 실행됨
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // 1. 방 입장 (비밀번호 확인)
  socket.on("join_room", (data) => {
    const { roomName, password } = data;

    // 비밀번호가 틀리면 에러 메시지 전송
    if (password !== ROOM_PASSWORD) {
      socket.emit("error_msg", "비밀번호가 틀렸습니다.");
      return;
    }

    // 비밀번호가 맞으면 방 입장
    socket.join(roomName);
    console.log(`User ${socket.id} joined room: ${roomName}`);
    
    // 이미 방에 있던 사람에게 "새 사람이 들어왔어!"라고 알림 (이때 Offer를 생성하게 됨)
    socket.to(roomName).emit("welcome");
  });

  // 2. Offer (통화 제안서) 전달
  socket.on("offer", (offer, roomName) => {
    // 나를 제외한 방 안의 사람들에게 전달
    socket.to(roomName).emit("offer", offer);
  });

  // 3. Answer (수락 응답서) 전달
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });

  // 4. ICE Candidate (네트워크 경로 정보) 전달
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });

  // 5. 연결 끊김 처리
  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// 중요: app.listen이 아니라 server.listen을 사용해야 합니다!
server.listen(3001, () => {
  console.log("🚀 Signaling Server running on port 3001");
});