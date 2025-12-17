// server/index.js
const express = require('express');
const app = express();

// 기본 주소('/')로 접속하면 인사말 건네기
app.get('/', (req, res) => {
  res.send('Hello from Cloud Browser Server! (WebRTC Ready)');
});

// 3001번 포트에서 대기
app.listen(3001, () => {
  console.log('🚀 Server running on port 3001');
});