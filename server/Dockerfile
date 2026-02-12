# 1단계: 빌드 및 종속성 설치 (Builder)
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# 모든 의존성 설치 (Prisma CLI 포함)
RUN npm ci

# 소스 전체 복사 및 Prisma 클라이언트 생성
COPY . .
RUN npx prisma generate

# 2단계: 실행 (Runner)
FROM node:22-alpine AS runner
WORKDIR /app

# 프로덕션 환경 설정
ENV NODE_ENV=production

# 1단계에서 완성된 결과물을 그대로 가져옴
# 프로덕션에 불필요한 파일은 .dockerignore로 필터링
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app ./

EXPOSE 3001 3002

# 기본 실행 명령
CMD ["node", "chat.js"]