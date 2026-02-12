# 1단계: 빌드 및 종속성 설치 (Builder)
FROM node:22-alpine AS builder
WORKDIR /app

# OpenSSL 설치
RUN apk add --no-cache openssl

# 패키지 파일 & 스키마 복사 (루트 기준)
COPY server/package*.json ./server/
COPY prisma ./prisma/

WORKDIR /app/server
# 의존성 설치
RUN npm ci

# 소스 복사 & Prisma Client 생성
COPY server/ .
# 스키마 위치 지정하여 생성
RUN npx prisma generate --schema=../prisma/schema.prisma

# 2단계: 실행 (Runner)
FROM node:22-alpine AS runner
WORKDIR /app

# OpenSSL 설치
RUN apk add --no-cache openssl

ENV NODE_ENV=production

# 필요한 파일만 복사
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server ./

EXPOSE 3001 3002

CMD ["node", "chat.js"]
