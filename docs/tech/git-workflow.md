# Git 브랜치 전략

```
main ──●────────────────●──────────●──   검증된 상태만. 직접 커밋 금지
        \              /          /
dev ─────●───●───●────●────●─────●────   통합 브랜치. 기능 브랜치가 여기로 합쳐짐
          \     /      \    /
feat/x     ●───●        \  /             작업 하나 = 브랜치 하나
fix/y                    ●●
```

## 브랜치
| 브랜치 | 역할 | 규칙 |
|---|---|---|
| `main` | 검증된 안정 상태 | 직접 커밋 금지. `dev`에서만 merge. merge 전 `docs/verification` 현황 표에서 타입체크·테스트 ✅ 확인 |
| `dev` | 통합 | 기능 브랜치만 merge. 직접 커밋은 문서 오타 수준만 |
| `feat/<이름>` | 기능 추가 | `dev`에서 따서 `dev`로 merge 후 삭제 |
| `fix/<이름>` | 버그 수정 | 동일 |
| `docs/<이름>` | 문서만 | 동일 |
| `chore/<이름>` | 설정·의존성 | 동일 |

이름은 영어 소문자·하이픈. 예: `feat/csv-import`, `fix/dashboard-month-end`, `docs/interop-en`.
AI 도구가 만든 브랜치는 이름 끝에 도구를 붙여도 된다: `feat/csv-import-cursor`, `feat/csv-import-claude` — 같은 작업을 두 도구가 동시에 하면 충돌하므로 **작업 시작 전 `progress/README.md`에 "진행 중" 표시**.

## 흐름 — 맥북 (zsh)
```bash
cd ~/개발/workspace/Finvesting

# 0. 처음 한 번: 브랜치 올리기
git push origin main
git push -u origin dev

# 1. 작업 시작 — 항상 최신 dev에서 기능 브랜치
git switch dev && git pull
git switch -c feat/csv-import

# 2. 작업·커밋 (type(scope): 요약)
git add -A && git commit -m "feat(interop): kakaobank csv parser"

# 3. 기능 브랜치 올리기 (기기 옮기기 전 필수)
git push -u origin feat/csv-import

# 4. dev로 통합
git switch dev && git pull
git merge --no-ff feat/csv-import
git push
git branch -d feat/csv-import
git push origin --delete feat/csv-import

# 5. 검증(타입체크·테스트·실행) 후 main으로
git switch main && git pull
git merge --no-ff dev
git push
git switch dev
```

## 흐름 — 윈도우 (PowerShell)
명령은 같고 경로·줄바꿈 설정만 다르다. Git Bash를 쓰면 맥 명령 그대로 사용 가능.
```powershell
# 처음 한 번 (clone 전에)
git config --global core.autocrlf false      # .gitattributes가 LF를 강제하므로 자동 변환 끔
git config --global core.longpaths true      # node_modules 긴 경로 오류 방지

cd D:\workspace\Finvesting                    # 한글 없는 경로 권장

# 1. 작업 시작
git switch dev; git pull
git switch -c feat/csv-import

# 2. 작업·커밋
git add -A; git commit -m "feat(interop): kakaobank csv parser"

# 3. 올리기
git push -u origin feat/csv-import

# 4. dev로 통합
git switch dev; git pull
git merge --no-ff feat/csv-import
git push
git branch -d feat/csv-import
git push origin --delete feat/csv-import

# 5. main으로
git switch main; git pull
git merge --no-ff dev
git push
git switch dev
```
PowerShell은 `&&` 대신 `;`(앞 명령 실패해도 계속 진행) — 중요한 단계는 한 줄씩 실행하고 결과를 확인한다.

## 기기 옮길 때 체크리스트
| 떠나는 기기 | 도착한 기기 |
|---|---|
| `git status`로 미커밋 변경 없는지 확인 | `git fetch --all` |
| 작업 브랜치 `git push` | `git switch <브랜치>` 후 `git pull` |
| (선택) `docs/progress/README.md`에 "어디까지 했는지" 한 줄 | `pnpm install` (lockfile 바뀌었을 수 있음) |
| | `pnpm typecheck`로 상태 확인 |

DB 데이터는 옮겨가지 않는다. 윈도우는 빈 DB로 시작하거나 맥에서 `docker exec finvesting-db pg_dump -U finvesting finvesting > dump.sql` 후 옮겨서 복원.

## GitHub 저장소 설정 (한 번)
1. Settings → General → Default branch → `dev` (clone·PR 기본이 dev가 됨)
2. Settings → Branches → Add rule → `main`: "Require a pull request before merging" 체크 (직접 push 차단). 혼자라 승인 수는 0
3. (선택) `dev`에도 같은 규칙을 걸면 AI 도구의 직접 push를 막을 수 있다 — 대신 매번 PR을 열어야 함

## AI 도구 규칙
- `main`·`dev`에 직접 커밋하지 않는다. 항상 기능 브랜치.
- 세션 시작 시 `git status`·`git branch --show-current`로 현재 브랜치 확인, `dev`면 기능 브랜치를 새로 딴다.
- 세션 끝에 커밋까지만. push·merge는 사용자가 지시할 때만.
