# 10 — 아키텍처

## 기술 스택
| 영역 | 선택 | 이유 |
|---|---|---|
| 언어 | TypeScript 전체 | 웹·모바일·worker·도메인 로직 코드 공유, 하나만 배우면 됨 |
| 모노레포 | Turborepo + pnpm workspaces | 앱·패키지 간 의존성 관리 |
| 웹 | Next.js 15 (App Router) | 대시보드 + API 라우트 겸용 |
| 모바일 | Expo (React Native) | 웹과 tRPC 클라이언트·타입 공유 |
| API | tRPC v11 | 서버-클라이언트 타입 안전, 별도 스키마 파일 없음 |
| DB | PostgreSQL 16 + pgvector (Docker) | 금융 데이터 관계형, 임베딩 검색, 서비스화 시 그대로 이전 |
| ORM | Drizzle | 타입 안전 스키마, 마이그레이션 |
| 수집 | node-cron + rss-parser + cheerio (+ Playwright 필요 시) | |
| AI | Ollama(로컬) → vLLM/클라우드 교체 가능한 프로바이더 인터페이스 | 하드웨어 계획에 맞춰 교체 |

## 데이터 흐름
```
[외부 소스] RSS · Upbit · ECOS · (KIS, Naver, 크롤러)
      │  apps/worker (cron)
      ▼
[PostgreSQL] market_news · market_quotes · macro_indicators · economic_events
             accounts · transactions · trades · financial_profiles
      │  packages/db (Drizzle)
      ▼
[packages/api] tRPC 라우터 ── packages/core(계산) ── packages/ai(LLM)
      │
      ├─ apps/web  (Next.js /api/trpc) ── 브라우저
      └─ apps/mobile (Expo) ── 같은 API를 HTTP로 호출
```

## 패키지 의존 규칙
- `core`는 아무것도 의존하지 않는다 (순수 함수). 계산 로직은 반드시 여기.
- `db`는 `core`를 모른다. 스키마와 연결만.
- `api`가 `db` + `core` + `ai`를 조합한다.
- `web`/`mobile`은 `api`의 타입만 import, DB 직접 접근 금지.
- `worker`는 `db`(+`ai` 임베딩)만 사용, `api`를 거치지 않는다.

## 인증
단일 사용자 모드. `DEFAULT_USER_ID`로 고정. 모든 사용자 데이터 테이블에 `user_id`가 있어 서비스화 시 인증만 붙이면 된다.

## 실행 형태
- 로컬: `pnpm dev` (web + worker 동시), Docker Postgres
- 모바일: Expo Go, 같은 Wi‑Fi에서 맥북 IP의 3000 포트 호출
- 서비스화 시: web은 Vercel/컨테이너, worker는 컨테이너 1개, DB는 Supabase/RDS — 코드 변경 없이 `DATABASE_URL`만 교체
