# 1. 빌드
FROM node:22-alpine AS builder

WORKDIR /app

# OpenSSL 설치 (Prisma 필수)
RUN apk add --no-cache openssl

# 의존성 설치
COPY client/package*.json ./
COPY prisma ./prisma/

# 의존성 설치
RUN npm ci

# 소스 코드 복사 및 빌드
COPY client/ .

# 빌드 시점에 필요한 환경변수 주입 (실제 값은 런타임에 overwritten됨)
ENV AUTH_SECRET="dummy_secret_for_build"

# Prisma Client 생성
# 이제 위치가 /app 이므로 ./prisma/schema.prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build time args
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_VIDEO_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
ENV NEXT_PUBLIC_VIDEO_SOCKET_URL=${NEXT_PUBLIC_VIDEO_SOCKET_URL}

# Next.js 빌드
RUN npm run build

# 2. 실행
FROM node:22-alpine AS runner

WORKDIR /app

# 프로덕션 환경 설정
ENV NODE_ENV=production

# OpenSSL 설치 (Prisma 필수)
RUN apk add --no-cache openssl

# 필수 파일 복사
# builder 단계의 /app 에서 생성된 파일들을 가져옴
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

# 포트 노출
EXPOSE 3000

# 실행 명령
CMD ["node", "server.js"]
