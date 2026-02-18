# 1단계: 빌드 및 종속성 설치 (Builder)
FROM node:22-alpine AS builder
WORKDIR /app

# OpenSSL 설치
RUN apk add --no-cache openssl

# 패키지 파일 & 스키마 복사 (루트 기준)
# server/package.json -> /app/package.json
COPY server/package*.json ./
COPY prisma ./prisma/

# 의존성 설치 (채팅 서버는 브라우저 불필요)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci

# 소스 복사 & Prisma Client 생성
# server/ -> /app/
COPY server/ .
# 스키마 위치: /app/prisma/schema.prisma
# 실행 위치: /app/
# 따라서 경로: ./prisma/schema.prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

# 2단계: 실행 (Runner)
FROM node:22-alpine AS runner
WORKDIR /app

# OpenSSL 설치
RUN apk add --no-cache openssl

ENV NODE_ENV=production

# 필요한 파일만 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
# 소스 코드가 이제 바로 /app에 있으므로 그대로 복사
COPY --from=builder /app/*.js ./

EXPOSE 3001 3002

CMD ["node", "chat.js"]
