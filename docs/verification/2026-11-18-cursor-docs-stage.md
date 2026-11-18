# 2026-11-18 — Cursor
- 환경: 맥북, Node v26.7.0, pnpm 9.15.0. Colima와 `finvesting-db`를 다시 띄운 뒤 `pnpm dev:web`
- 범위: 영문 미러와 로드맵이 어긋난 단계 문장을 맞추고, 웹이 응답하는지 확인

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| 웹 | `curl` `http://127.0.0.1:3000/` 와 `/realty` | 둘 다 200 |
| Postgres | `pg_isready -U finvesting` | accepting connections |

## 정적 검토 (실행 없이 문서 읽기)
| 항목 | 판단 |
|---|---|
| `README.md` · `README.en.md` 현재 단계 | 로드맵의 1–3단계 체크, ADR 0058·0059와 같게 고침. 한투 시세는 ADR 0053대로 하지 않음 |
| `overview.md` · `overview.en.md` 「이후」 | 2·3단계는 끝난 일로, 4·5단계 남은 일은 로드맵 미체크 항목만 |
| `architecture.md` | `financial_statements`를 영문과 같은 줄에 넣음 |
| `docs/README.md` | `tech/djecisions/`를 `tech/decisions/`로 고침 |

## 검증 못 함 / 다음 AI에게
- 화면을 브라우저에서 눌러 보지는 않음. 응답 코드만 확인
- `ECOS_API_KEY`는 비어 있는지 이 세션에서 다시 보지 않음
