# CLI 및 실행 명령어 레퍼런스 (Commands)

Finvesting 모노레포에서 사용하는 개발, 데이터베이스, 워커, 테스트 및 Git 워크플로우 명령어 모음입니다.

---

## 1. 빠른 참조 표 (Quick Reference)

| 명령 | 설명 | 비고 |
|---|---|---|
| `pnpm dev` | 전체 앱 병렬 실행 (웹 + 워커) | Turborepo (`turbo run dev`) |
| `pnpm dev:web` | 웹 프론트엔드 & API 서버 실행 | `http://127.0.0.1:3000` |
| `pnpm dev:worker` | 데이터 수집 워커 데몬 실행 | 스케줄러(cron) 기반 주기 수집 |
| `pnpm dev:mobile` | 모바일 앱(Expo) 개발 서버 실행 | QR 코드 스캔 |
| `pnpm --filter @finvesting/worker run:once` | 워커 1회 즉시 실행 | 크롤러/수집 즉시 테스트용 |
| `pnpm --filter @finvesting/web dev:lan` | 모바일 실기기 연동용 LAN 웹 실행 | `0.0.0.0:3000` 바인딩 |
| `pnpm db:up` | PostgreSQL + pgvector Docker 컨테이너 시작 | Docker Desktop 필요 |
| `pnpm db:down` | DB Docker 컨테이너 중지 | |
| `pnpm db:generate` | Drizzle 마이그레이션 파일 생성 | 스키마 변경 시 |
| `pnpm db:migrate` | DB 마이그레이션 적용 | |
| `pnpm db:studio` | Drizzle Studio 웹 GUI 실행 | `https://local.drizzle.studio` |
| `pnpm typecheck` | 전체 모노레포 TypeScript 타입 검사 | `turbo run typecheck` |
| `pnpm --filter @finvesting/core test` | Core 패키지 단위 테스트 실행 | Vitest |
| `pnpm --filter @finvesting/interop test` | Interop 패키지 단위 테스트 실행 | Vitest |
| `pnpm build` | 프로덕션 빌드 | |

---

## 2. 세부 카테고리별 명령어

### 2.1 개발 서버 구동

```bash
# 1. 웹 프론트엔드 및 tRPC API 서버
pnpm dev:web

# 2. 데이터 수집 워커 데몬 (주기적 뉴스 및 시세 수집)
pnpm dev:worker

# 3. 전체 모노레포 동시 구동
pnpm dev
```

### 2.2 데이터베이스 관리 및 초기화 (Docker & Seed)

DB 컨테이너를 구동한 후 pgvector 확장 활성화 및 기본 유저 생성을 진행합니다.

#### Windows (PowerShell)
PowerShell에서는 `<` 리다이렉션 대신 `Get-Content |` 파이프 방식을 사용합니다.
```powershell
# 컨테이너 시작
pnpm db:up

# pgvector 확장 기능 활성화
Get-Content packages\db\seed\000_extensions.sql | docker exec -i finvesting-db psql -U finvesting -d finvesting

# 스키마 마이그레이션
pnpm db:generate
pnpm db:migrate

# 기본 사용자 생성
Get-Content packages\db\seed\001_default_user.sql | docker exec -i finvesting-db psql -U finvesting -d finvesting

# 재무 프로필 및 전체 패널 샘플 데이터 시딩 (한글 인코딩 방지를 위해 docker cp 권장)
docker cp packages/db/seed/002_sample_profile.sql finvesting-db:/tmp/002_sample_profile.sql
docker exec finvesting-db psql -U finvesting -d finvesting -f /tmp/002_sample_profile.sql

# DB GUI 확인 (선택)
pnpm db:studio
```

#### macOS / Linux (Bash/Zsh)
```bash
# 컨테이너 시작
pnpm db:up

# pgvector 확장 활성화 (psql 직접 연결 또는 docker exec)
psql postgresql://finvesting:finvesting@localhost:5432/finvesting -f packages/db/seed/000_extensions.sql
# (docker exec 대안: docker exec -i finvesting-db psql -U finvesting -d finvesting < packages/db/seed/000_extensions.sql)

# 스키마 마이그레이션
pnpm db:generate && pnpm db:migrate

# 기본 사용자 생성
psql postgresql://finvesting:finvesting@localhost:5432/finvesting -f packages/db/seed/001_default_user.sql
```

### 2.3 데이터 수집 워커 (Worker)

```bash
# 개발 모드 (tsx watch 기반 파일 변경 감지 및 자동 재시작)
pnpm dev:worker

# 1회 즉시 실행 (전체 수집기 1회 동작 후 프로세스 종료)
pnpm --filter @finvesting/worker run:once

# 프로덕션 실행
pnpm --filter @finvesting/worker start
```

### 2.4 테스트 및 코드 검증 (Verification)

```bash
# 전체 워크스페이스 타입체크 (8개 패키지 전체)
pnpm typecheck

# Core 순수 로직 단위/회귀 테스트 (포트폴리오, 타임라인, 환율, 원장 등)
pnpm --filter @finvesting/core test

# Interop 파일 파서 단위 테스트 (통장/증권사 CSV, 엑셀 파서 등)
pnpm --filter @finvesting/interop test

# 전체 프로덕션 빌드 검증
pnpm build
```

---

## 3. Windows PowerShell 트러블슈팅 및 팁

### ① `pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`
- **원인**: Docker Desktop 앱이 켜져 있지 않거나, 윈도우 부팅 직후 엔진이 시동 중(Starting)일 때 발생합니다.
- **조치**:
  1. Windows 시작 메뉴에서 **Docker Desktop**을 실행합니다.
  2. 작업 표시줄 트레이의 고래 아이콘이 깜빡임을 멈추고 초록색/정상 작동(`Docker Desktop is running`) 상태가 될 때까지 약 30초~1분 대기합니다.
  3. `docker ps` 실행으로 정상 응답을 확인한 후 `pnpm db:up`을 재실행합니다.

### ② 연산자 `&&` 미지원 오류 (Windows PowerShell 5.1)
- **원인**: 기본 Windows PowerShell 5.1에서는 `&&` 연결 연산자를 지원하지 않습니다.
- **조치**: 명령어를 한 줄씩 따로 실행하거나 세미콜론(`;`)으로 구분합니다:
  ```powershell
  # 권장 (한 줄씩 실행)
  pnpm db:generate
  pnpm db:migrate
  ```

### ③ 파일 리다이렉션 `<` 구문 오류
- **원인**: PowerShell에서 `<` 연산자는 예약어로 제한되어 있어 bash 스타일 파일 주입이 동작하지 않습니다.
- **조치**: `Get-Content <경로> | docker exec -i ...` 형태로 파이프라인을 사용합니다.

---

## 4. Git 브랜치 작업 요약

자세한 내용은 [git-workflow.md](./git-workflow.md) 및 [AGENTS.md](../../AGENTS.md)를 준수합니다. (`main`/`dev` 직접 커밋 금지)

```powershell
# 1. dev 최신화 및 기능 브랜치 생성
git switch dev
git pull
git switch -c feat/기능이름

# 2. 작업 내용 커밋
git add -A
git commit -m "feat(scope): 변경 내용 요약"

# 3. 원격 브랜치 푸시
git push -u origin feat/기능이름

# 4. 기능 브랜치를 dev로 병합
git switch dev
git pull
git merge --no-ff feat/기능이름
git push
git branch -d feat/기능이름
```
