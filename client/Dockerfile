# 1. 빌드
FROM node:22-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 2. 실행
FROM node:22-alpine AS runner

WORKDIR /app

# 프로덕션 환경 설정
ENV NODE_ENV=production

# 필수 파일 복사
# Next.js standalone build puts the necessary files in .next/standalone
# We also need public folder and static files for proper rendering
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

# 포트 노출
EXPOSE 3000

# 실행 명령
# Next.js standalone 모드로 빌드 시 생성되는 최적화된 실행 파일(server.js)
CMD ["node", "server.js"]
