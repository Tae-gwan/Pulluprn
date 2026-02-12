# 1. 빌드
FROM node:22-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY client/package*.json ./client/
COPY prisma ./prisma/

WORKDIR /app/client
RUN npm ci

# 소스 코드 복사 및 빌드
COPY client/ .
RUN npm run build

# 2. 실행
FROM node:22-alpine AS runner

WORKDIR /app

# 프로덕션 환경 설정
ENV NODE_ENV=production

# 필수 파일 복사
COPY --from=builder /app/client/next.config.ts ./
COPY --from=builder /app/client/public ./public
COPY --from=builder /app/client/.next/static ./.next/static
COPY --from=builder /app/client/.next/standalone ./

# 포트 노출
EXPOSE 3000

# 실행 명령
CMD ["node", "server.js"]
