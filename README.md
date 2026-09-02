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

자세한 설정은 [docs/50-setup](./docs/50-setup/README.md).

## 문서

| 폴더 | 내용 |
|---|---|
| [docs/00-overview](./docs/00-overview/README.md) | 제품 정의, 핵심 사용자, 범위 |
| [docs/10-architecture](./docs/10-architecture/README.md) | 모노레포 구조, 데이터 흐름, 기술 스택 |
| [docs/20-data-model](./docs/20-data-model/README.md) | DB 테이블과 의미 |
| [docs/30-data-sources](./docs/30-data-sources/README.md) | 수집 소스(API/크롤링), 스케줄, 법적 주의 |
| [docs/40-ai](./docs/40-ai/README.md) | 챗봇·LLM 프로바이더·RAG 설계 |
| [docs/50-setup](./docs/50-setup/README.md) | 맥/윈도우 개발 환경 |
| [docs/60-decisions](./docs/60-decisions/README.md) | 아키텍처 결정 기록(ADR) |
| [docs/70-progress](./docs/70-progress/README.md) | 진행 상황 로그 |
| [docs/80-roadmap](./docs/80-roadmap/README.md) | MVP 단계와 다음 할 일 |
