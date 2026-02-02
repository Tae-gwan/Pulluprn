"use strict";

// 간단한 WebRTC 1:1 통화용 시그널링 서버
// - 역할: Offer / Answer / ICE candidate를 두 클라이언트 사이에서 중계
// - 실제 미디어(영상/음성)는 WebRTC P2P로 전송되고, 이 서버는 관여하지 않음

require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Socket.io 설정
// NOTE:
// - 프론트엔드(Next.js)는 기본적으로 http://localhost:3000 에서 동작
// - 이 서버는 별도의 포트(예: 3002)를 사용해 CORS 허용
// path를 /videocall/socket.io로 설정 → Nginx에서 /videocall/을 3002로 보낼 때 채팅(3001)과 구분됨
const io = new Server(server, {
  path: "/videocall/socket.io",
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`📞 VideoCall socket connected: ${socket.id}`);

  // 1. 방 입장 (비밀번호 확인 포함)
  socket.on("join_room", (data) => {
    const { roomName } = data || {};

    if (!roomName) {
      socket.emit("error_msg", "roomName is required");
      return;
    }

    socket.join(roomName);
    console.log(`📁 Socket ${socket.id} joined video room: ${roomName}`);

    // 이미 방에 있던 사람들에게 "새 참가자" 알림
    socket.to(roomName).emit("welcome");
  });

  // 2. WebRTC Offer 중계
  socket.on("offer", (offer, roomName) => {
    if (!roomName) return;
    console.log(`🔁 offer relay in room ${roomName} from ${socket.id}`);
    socket.to(roomName).emit("offer", offer);
  });

  // 3. WebRTC Answer 중계
  socket.on("answer", (answer, roomName) => {
    if (!roomName) return;
    console.log(`🔁 answer relay in room ${roomName} from ${socket.id}`);
    socket.to(roomName).emit("answer", answer);
  });

  // 4. ICE Candidate 중계
  socket.on("ice", (ice, roomName) => {
    if (!roomName) return;
    // ice 객체 자체를 그대로 전달 (브라우저가 생성한 RTCIceCandidate 정보)
    socket.to(roomName).emit("ice", ice);
  });

  // 5. 연결 종료 로그
  socket.on("disconnect", () => {
    console.log(`❌ VideoCall socket disconnected: ${socket.id}`);
  });
});

// 채팅 서버(chat.js)와 포트가 겹치지 않도록 별도 포트 사용
// 예: 3002 (docker-compose나 실행 스크립트에서 이 파일을 따로 실행)
const PORT = process.env.VIDEOCALL_PORT || 3002;

server.listen(PORT, () => {
  console.log(`🚀 VideoCall signaling server running on port ${PORT}`);
});

