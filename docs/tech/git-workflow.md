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

## 흐름
```bash
git switch dev && git pull                 # 최신 dev
git switch -c feat/csv-import              # 기능 브랜치
# ... 작업, 커밋 (type(scope): 요약)
git push -u origin feat/csv-import
git switch dev && git merge --no-ff feat/csv-import && git push   # dev로 통합 (또는 GitHub PR)
git branch -d feat/csv-import
# 검증 후
git switch main && git merge --no-ff dev && git push && git switch dev
```
혼자 작업이므로 PR은 선택. 단 AI 도구가 만든 변경은 사람이 diff를 한 번 보고 dev에 합친다.

## 두 기기(맥북·윈도우)
- 기기를 옮기기 전 반드시 `git push`, 옮긴 후 `git pull`
- 같은 기능 브랜치를 두 기기에서 동시에 건드리지 않는다
- `pnpm-lock.yaml`은 커밋 대상. 충돌하면 `pnpm install` 다시 돌려 재생성

## AI 도구 규칙
- `main`·`dev`에 직접 커밋하지 않는다. 항상 기능 브랜치.
- 세션 시작 시 `git status`·`git branch --show-current`로 현재 브랜치 확인, `dev`면 기능 브랜치를 새로 딴다.
- 세션 끝에 커밋까지만. push·merge는 사용자가 지시할 때만.
