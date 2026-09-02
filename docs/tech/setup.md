# 개발 환경 설정

맥북과 윈도우를 오가며 작업한다. 코드는 Git으로, DB 데이터는 기본적으로 **주 작업 기기(맥북)에만** 둔다. 양쪽에서 실데이터가 필요해지면 `DATABASE_URL`을 Supabase 등 호스팅 Postgres로 바꾼다.

## 공통 요구사항

- Node 22 (`.nvmrc`) — 맥: `fnm`/`nvm`, 윈도우: `fnm` 또는 nvm-windows
- pnpm 9 — `corepack enable && corepack prepare pnpm@9.15.0 --activate`
- Docker Desktop (Postgres용)
- Ollama (챗봇용) — `ollama pull qwen2.5:7b && ollama pull nomic-embed-text`
- Git 줄바꿈: `.gitattributes`로 LF 강제. 윈도우는 `git config --global core.autocrlf false` 권장

## 경로


| 기기  | 경로                                  |
| --- | ----------------------------------- |
| 맥북  | `/Users/th/개발/workspace/Finvesting` |
| 윈도우 | (미정 — 정해지면 여기 기록)                   |
| 원격  | `https://github.com/kotaehyun/Finvesting` (브랜치 `main`) |


## 첫 실행

```bash
pnpm install
cp .env.example .env            # 저장소 루트. web·worker·db가 이 파일을 읽는다
pnpm db:up                       # Postgres + pgvector
psql postgresql://finvesting:finvesting@localhost:5432/finvesting -f packages/db/seed/000_extensions.sql
pnpm db:generate && pnpm db:migrate
psql postgresql://finvesting:finvesting@localhost:5432/finvesting -f packages/db/seed/001_default_user.sql
pnpm dev:web                     # http://localhost:3000
pnpm dev:worker                  # 또는 pnpm --filter @finvesting/worker run:once 로 1회 수집
```

## 모바일

- 루트 `.env`의 `EXPO_PUBLIC_API_URL=http://<맥북 IP>:3000` (`apps/mobile/app.config.ts`가 루트 .env를 읽음. 실기기에서는 localhost가 폰 자신이므로 반드시 맥북 IP)
- `pnpm dev:mobile` → Expo Go로 QR 스캔 (같은 Wi‑Fi)



## 윈도우에서 처음 받기
```powershell
git config --global core.autocrlf false
git clone https://github.com/kotaehyun/Finvesting.git D:\workspace\Finvesting
cd D:\workspace\Finvesting
corepack enable; corepack prepare pnpm@9.15.0 --activate
pnpm install
copy .env.example .env
```
이후 "첫 실행" 절차와 동일. DB 데이터는 맥북과 공유되지 않으므로 윈도우는 빈 DB로 시작한다.

## 브랜치·기기 이동
브랜치 전략과 맥/윈도우별 git 명령, 기기 옮길 때 체크리스트는 [git-workflow.md](./git-workflow.md).

## 윈도우 주의

- 한글 경로는 피하는 것이 안전 (`D:\workspace\Finvesting` 등)
- PowerShell에서 `psql`이 없으면 Docker 컨테이너로: `docker exec -i finvesting-db psql -U finvesting -d finvesting < packages/db/seed/000_extensions.sql`

