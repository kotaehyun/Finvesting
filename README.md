# Finvesting

개인 자산·투자·돈의 흐름을 한곳에서 파악하고, 수집한 시장 정보를 바탕으로 로컬 LLM 챗봇과 대화하며 투자 판단을 돕는 **개인용 금융 업무 터미널**.
현재는 본인 로컬 사용 목적이며, 최적화가 끝나면 서비스화를 검토한다.

> **AI 도구(Claude, Cursor, Codex, Copilot 등)로 작업할 때는 반드시 [`docs/`](./docs/README.md)를 먼저 읽고, 작업 후 해당 문서를 업데이트한다.** 문서가 곧 프로젝트의 단일 진실 원천(SSOT)이다.

## 구조

```
apps/
  web/       Next.js 15 — 웹 대시보드 + tRPC API 라우트
  mobile/    Expo (React Native) — 모바일 대시보드
  worker/    수집기 — 뉴스 RSS · 시세 · 거시지표를 스케줄 수집해 DB 저장
packages/
  db/        Drizzle ORM 스키마·마이그레이션 (PostgreSQL + pgvector)
  core/      순수 도메인 로직 — 현금흐름 요약, 배분 가이드, 포지션 계산
  api/       tRPC 라우터 — 웹·모바일이 공유
  ai/        LLM 프로바이더 추상화 (Ollama → 맥스튜디오 → DGX Spark/vLLM)
docs/        프로젝트 문서 (SSOT)
```

## 빠른 시작

```bash
corepack enable && corepack prepare pnpm@9.15.0 --activate
pnpm install
cp .env.example .env
pnpm db:up          # Docker Postgres(pgvector) 실행
pnpm db:generate && pnpm db:migrate
psql "$DATABASE_URL" -f packages/db/seed/001_default_user.sql
pnpm dev:web        # http://localhost:3000
pnpm dev:worker     # 수집기
pnpm dev:mobile     # Expo (같은 Wi-Fi, .env의 EXPO_PUBLIC_API_URL을 맥 IP로)
```

자세한 설정은 [docs/tech/setup.md](./docs/tech/setup.md).

## 문서

| 폴더 | 내용 |
|---|---|
| [docs/progress](./docs/progress/README.md) | 진행 로그, 로드맵 |
| [docs/tech](./docs/tech/README.md) | 제품 개요, 아키텍처, 데이터 모델, 수집 소스, AI, 환경 설정, ADR |
| [docs/logs](./docs/logs/README.md) | 실행 로그, 오류 기록 |
| [docs/review](./docs/review/README.md) | 코드 리뷰 기록 |
