# PullUpRN Architecture

## 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Compose                       │
│                                                          │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────┐ │
│  │  Client   │  │ Chat Server│  │Video     │  │  DB   │ │
│  │  Next.js  │  │ Socket.IO  │  │Server    │  │Postgre│ │
│  │  :3000    │  │  :3001     │  │  :3002   │  │ :5432 │ │
│  └──────────┘  └────────────┘  └──────────┘  └───────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 서버 (Backend)

### 서비스 구성

| 서비스 | 파일 | 포트 | 역할 |
|---|---|---|---|
| Chat Server | `server/chat.js` | 3001 | 채팅 메시지 중계, 온라인 상태 관리, 타이핑 표시 |
| Video Server | `server/videocall.js` | 3002 | WebRTC 시그널링 중계 (offer/answer/ICE) |
| Database | PostgreSQL 17 | 5432 | 유저, 메시지, 친구관계 등 영구 저장 |

### 서버 파일

| 파일 | 설명 |
|---|---|
| `chat.js` | Socket.IO 채팅 서버 — 메시지 저장/중계, 온라인 유저 추적, 타이핑 이벤트 |
| `videocall.js` | Socket.IO 시그널링 서버 — WebRTC offer/answer/ICE candidate 중계만 담당 |
| `prisma.js` | Prisma Client 싱글톤 인스턴스 |
| `index.js` | 서버 진입점 |

---

## 클라이언트 (Frontend)

### 페이지 (`app/`)

| 경로 | 설명 |
|---|---|
| `page.tsx` | 랜딩 페이지 — 로그인/회원가입 또는 대기열 등록 |
| `layout.tsx` | 전체 앱 레이아웃 — SessionProvider + 공통 UI 감싸기 |
| `providers.tsx` | NextAuth SessionProvider 래퍼 |
| `call/[id]/page.tsx` | 1:1 영상통화 페이지 — 비디오 렌더링 + 컨트롤 바 |
| `chat/` | 채팅 페이지 — 대화 목록 + 채팅방 |
| `friends/` | 친구 목록 페이지 — 친구 추가/삭제/요청 관리 |
| `profile/` | 프로필 페이지 — 유저 정보 표시/수정 |
| `user/` | 유저 관련 페이지 |

### API Routes (`app/api/`)

| 경로 | 메서드 | 설명 |
|---|---|---|
| `auth/` | - | NextAuth 인증 처리 (Google OAuth) |
| `friends/` | GET/POST/DELETE | 친구 목록 조회, 요청 전송, 수락/거절 |
| `messages/` | GET/POST | 채팅 메시지 조회 (커서 기반 페이지네이션) |
| `messages/conversations/` | GET | 대화 목록 + 마지막 메시지 미리보기 |
| `user/` | GET/PATCH | 유저 정보 조회/수정 |
| `verify-code/` | POST | 스테이징 접근 코드 검증 |
| `waitlist/` | POST | 대기열 이메일 등록 |

---

## Services

| 파일 | 설명 |
|---|---|
| `socketService.ts` | 채팅 Socket.IO 싱글톤 — 소켓 연결/해제, 메시지 송수신, 타이핑/온라인 이벤트 래핑 |

> `SocketService` 클래스의 인스턴스를 모듈 레벨에서 1개만 생성(`export const socketService = new SocketService()`).
> JS 모듈 캐싱에 의해 앱 전체에서 동일한 소켓 연결을 공유한다.

---

## Context

| 파일 | 설명 |
|---|---|
| `SessionContext.tsx` | 로그인 유저 정보(userId, username, email)를 앱 전체에 공유하는 React Context |

---

## Hooks

### 채팅 관련

| Hook | 설명 |
|---|---|
| `useSocket.ts` | 로그인 시 채팅 소켓 자동 연결, 로그아웃 시 해제 — 앱 전체 생명주기 관리 |
| `useChatRoom.ts` | 채팅방 메시지 수신, 이전 메시지 로드(API), 타이핑 감지 — 채팅방 단위 |
| `useMessageInput.ts` | 메시지 입력/전송, 타이핑 신호 발신 — 입력 UI 로직 |
| `useConversations.ts` | 대화 목록 조회(API) + 실시간 마지막 메시지 업데이트(Socket) — 사이드바 |
| `useOnlineUsers.ts` | 친구 온라인/오프라인 상태 실시간 추적 — Set 기반 관리 |

### 영상통화 관련

| Hook | 설명 |
|---|---|
| `videoSocket.ts` | 영상통화 시그널링 전용 Socket.IO 인스턴스 (포트 3002, `autoConnect: false`) |
| `useLocalStream.ts` | 내 카메라/마이크 스트림 획득, 오디오/비디오 토글, GainNode 볼륨 제어, 장치 교체 |
| `useWebRTC.ts` | RTCPeerConnection 생성, offer/answer/ICE 교환, 원격 스트림 수신, 연결 상태 추적 |
| `useVideoCall.ts` | 영상통화 전체 통합 — 볼륨, 전체화면, 장치선택, 타이머, 통화 종료 |
| `useMediaDevices.ts` | 사용 가능한 미디어 장치(마이크/스피커/카메라) 목록 조회 + 변경 감지 |

---

## Components

| 폴더 | 설명 |
|---|---|
| `Button/` | 공통 버튼, 네비게이션 버튼 (뉴모피즘 스타일) |
| `chat/` | 채팅 UI — 메시지 말풍선, 입력창, 대화 목록, 타이핑 인디케이터 |
| `friends/` | 친구 목록, 친구 카드, 친구 요청 UI |
| `layout/` | 앱 레이아웃 — 사이드바, 헤더, 네비게이션 |
| `video/` | 영상통화 컨트롤 바 (`FloatingControlBar`), 장치 설정 패널 (`DeviceSettingsPanel`) |

---

## 데이터 흐름

### 채팅 메시지 흐름

```
사용자 A (브라우저)                  서버 (chat.js)                  사용자 B (브라우저)
      │                                 │                                 │
      │  useMessageInput                │                                 │
      │  └─ socketService.sendMessage() │                                 │
      │     emit('chat message') ──────►│                                 │
      │                                 │── DB에 메시지 저장 (Prisma)      │
      │                                 │                                 │
      │   socketService.onMyMessage()   │   socketService.onOtherMessage()│
      │◄── emit('my message') ─────────│──── emit('other message') ────►│
      │                                 │                                 │
      │   useChatRoom                   │   useChatRoom                   │
      │   └─ messages 상태 업데이트      │   └─ messages 상태 업데이트      │
```

### 영상통화 흐름

```
사용자 A                            서버 (videocall.js)              사용자 B
      │                                 │                                 │
      │  useVideoCall.startStream()     │                                 │
      │  └─ getUserMedia() → 카메라 켜기 │                                 │
      │                                 │                                 │
      │  useWebRTC                      │                                 │
      │  └─ videoSocket                 │                                 │
      │     emit('join_room') ─────────►│◄── emit('join_room')           │
      │                                 │──── emit('welcome') ──────────►│
      │◄── emit('offer') ──────────────│◄── emit('offer')               │
      │     emit('answer') ────────────►│──── emit('answer') ───────────►│
      │◄── emit('ice') ────────────────│◄── emit('ice')                 │
      │     emit('ice') ───────────────►│──── emit('ice') ──────────────►│
      │                                 │                                 │
      │◄════════════ WebRTC P2P 연결 (서버 경유 안 함) ═══════════════►│
      │              영상/음성 직접 전송                                   │
```

### 온라인 상태 흐름

```
사용자 A 로그인                     서버 (chat.js)                  친구 목록 페이지
      │                                 │                                 │
      │  useSocket                      │                                 │
      │  └─ socketService.connect()     │                                 │
      │     연결 시 userId 전달 ────────►│── onlineUsers Map에 추가        │
      │                                 │                                 │
      │                                 │   useOnlineUsers                │
      │                                 │──── emit('user_online') ──────►│
      │                                 │     { userId: A }               │
      │                                 │                                 │
      │  접속 종료                       │                                 │
      │     disconnect ────────────────►│── onlineUsers Map에서 제거      │
      │                                 │──── emit('user_offline') ─────►│
```

---

## Socket.IO 이벤트 목록

### 채팅 서버 (포트 3001)

| 이벤트 | 방향 | 설명 |
|---|---|---|
| `chat message` | Client → Server | 메시지 전송 `{ message, username, receiverId }` |
| `my message` | Server → Client | 내가 보낸 메시지 확인 `{ message, username, senderId, receiverId }` |
| `other message` | Server → Client | 상대방 메시지 수신 |
| `latest message` | Server → Client | 대화 목록 미리보기 업데이트 `{ friendId, lastMessage, timestamp }` |
| `typing message` | 양방향 | 타이핑 시작 신호 |
| `stop typing` | 양방향 | 타이핑 중지 신호 |
| `user_online` | Server → Client | 유저 접속 알림 `{ userId }` |
| `user_offline` | Server → Client | 유저 오프라인 알림 `{ userId }` |
| `get_online_users` | Client → Server | 현재 온라인 유저 목록 요청 |
| `online_users_list` | Server → Client | 온라인 유저 ID 배열 `string[]` |

### 영상통화 서버 (포트 3002)

| 이벤트 | 방향 | 설명 |
|---|---|---|
| `join_room` | Client → Server | 영상통화 방 입장 `{ roomName }` |
| `welcome` | Server → Client | 새 참가자 알림 (상대방에게) |
| `offer` | 양방향 (중계) | WebRTC SDP Offer |
| `answer` | 양방향 (중계) | WebRTC SDP Answer |
| `ice` | 양방향 (중계) | ICE Candidate |

---

## DB 스키마 (Prisma)

```
┌──────────┐     ┌───────────┐     ┌──────────┐
│   User   │────►│  Account  │     │ Session  │
│          │     │ (OAuth)   │     │          │
│  id      │     │ provider  │     │ token    │
│  name    │     │ accountId │     │ expires  │
│  email   │     └───────────┘     └──────────┘
│  image   │
└──────────┘
     │  │
     │  └──────────────────────┐
     │                         │
     ▼                         ▼
┌──────────────┐        ┌───────────┐
│  Friendship  │        │  ChatRoom │
│              │        │           │
│  senderId    │        │  user1Id  │──────┐
│  receiverId  │        │  user2Id  │      │
│  status      │        └───────────┘      │
│  (PENDING/   │              │            │
│   ACCEPTED/  │              ▼            │
│   DECLINED)  │        ┌───────────┐      │
└──────────────┘        │  Message  │      │
                        │           │◄─────┘
                        │  senderId │
                        │  receiverId│
                        │  text     │
                        │  chatRoomId│
                        └───────────┘

┌──────────────┐     ┌───────────────────┐
│  Waitlist    │     │VerificationToken  │
│  email       │     │ (미래 확장용)      │
└──────────────┘     └───────────────────┘
```

### 모델 요약

| 모델 | 설명 |
|---|---|
| `User` | 유저 핵심 정보 — OAuth 계정, 세션, 친구, 메시지와 연결 |
| `Account` | OAuth 소셜 계정 — 구글/깃허브 등 다중 로그인 지원 |
| `Session` | 로그인 세션 관리 — 만료 시간 포함 |
| `VerificationToken` | 이메일 인증/비밀번호 찾기용 토큰 (확장용) |
| `Friendship` | 친구 관계 — PENDING → ACCEPTED/DECLINED 상태 전이 |
| `ChatRoom` | 1:1 대화방 — user1 + user2 유니크 제약 |
| `Message` | 채팅 메시지 — 송신자/수신자/채팅방 외래키, 시간순 인덱스 |
| `Waitlist` | 대기열 이메일 — 랜딩 페이지 사전 등록 |

---

## 인프라 (Docker)

```yaml
services:
  client:        # Next.js (Standalone) — 포트 3000
  server-chat:   # Socket.IO 채팅 서버 — 포트 3001
  server-video:  # Socket.IO 시그널링 서버 — 포트 3002
  db:            # PostgreSQL 17 — 포트 5432 (내부만)
```

| 설정 | 값 |
|---|---|
| 로그 제한 | `max-size: 10m`, `max-file: 3` (디스크 부족 방지) |
| DB 볼륨 | `external: true` (영구 저장) |
| DB 접근 | `127.0.0.1:5432` (EC2 내부만) |
| 시작 순서 | `db healthcheck` → `server-chat (prisma db push)` → `client` |

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | Next.js 15 (App Router), React, TypeScript |
| Backend | Node.js, Express, Socket.IO |
| Database | PostgreSQL 17, Prisma ORM |
| Authentication | NextAuth.js (Google OAuth) |
| Real-time Chat | Socket.IO (WebSocket) |
| Video Call | WebRTC (P2P), Web Audio API |
| Styling | CSS Modules (뉴모피즘 디자인) |
| Deployment | Docker Compose, AWS EC2 |
