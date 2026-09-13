# verification — AI 모델별 검증 기록

**어떤 AI(모델/도구)가, 무엇을, 어떤 방법으로 검증했고, 결과가 무엇이었는지**를 남긴다.
목적: 다음 AI가 "이미 검증된 것"과 "아직 아무도 확인 안 한 것"을 구분해 같은 검증을 반복하거나, 검증 안 된 것을 검증됐다고 믿는 일을 막는다.

`review/`(코드 리뷰 = 문제 찾기)와 다르다. 여기는 **확인 행위 자체**의 기록이다 — 타입체크 통과, 테스트 통과, API 응답 확인, 실행 성공 같은 것.

## 규칙
- 세션마다 파일 하나: `YYYY-MM-DD-<모델>.md` (같은 날 같은 모델이면 `-2`)
- **실제로 실행해서 본 것만** "검증됨"으로 적는다. 코드를 읽고 "맞아 보인다"는 "정적 검토"로 구분한다.
- 검증 환경(맥/윈도우/VM, Node 버전)을 반드시 적는다 — 환경이 다르면 결과가 다를 수 있다.
- 검증 **못 한 것**도 적는다. 다음 AI가 이어받을 목록이 된다.
- 다른 AI의 검증 결과를 재확인했으면 그 사실도 적는다 (교차 검증).

## 형식
```
# YYYY-MM-DD — <모델/도구 이름>
- 환경: (맥북/윈도우/클라우드 VM, Node·pnpm 버전, 실행 가능 여부)
- 범위: 무엇을 검증하려 했는가

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |

## 정적 검토 (실행 없이 코드 읽기)
| 항목 | 판단 |

## 검증 못 함 / 다음 AI에게
- ...

## 교차 검증
- (다른 AI의 어떤 결과를 재확인했는지)
```

## 검증 현황 요약 (최신 상태 — 항목이 바뀌면 갱신)
✅ 실행 확인 · ⏸ 키/대상 없어 보류(코드 경로는 skip까지 확인) · ❌ 아무도 실행 안 함
| 항목 | 상태 | 마지막 검증 | 누가 |
|---|---|---|---|
| `pnpm install` | ✅ | 2026-09-02 | Cursor |
| 타입체크 (web 포함 8패키지) | ✅ | 2026-09-13 | Cursor(09-02), Claude 재확인 7패키지(web 포함, mobile 제외 — 리눅스 VM Node 22) |
| core 테스트 (vitest) | ✅ 37개 (holdings-summary 4 · statement 6 · payroll 5 · trends 3 포함) | 2026-09-13 | Grok, Claude 교차 검증(node:test 셈) |
| interop 테스트 | ✅ 3개 | 2026-09-02 | Cursor |
| `pnpm db:generate` / `db:migrate` | ✅ `0002_yielding_paibok` (`pay_earnings`) 적용 | 2026-09-12 | Grok |
| seed SQL 적용 (extensions, default user) | ✅ | 2026-09-02 | 사용자(맥 터미널) |
| `pnpm dev:web` 기동 + `/` 렌더 + tRPC `dashboard.overview`,`market.latestNews` 200 | ✅ Next 15.5.25. 2026-09-08 `dev` 머지 후 Chrome: 순자산 3,635,000 | 2026-09-08 | Grok Chrome |
| `/profile` 프로필대장 + `workspaceSave`/`previewPay` | ✅ 페이지 200, 저장 추가·삭제 원상복구, 4대보험 미리보기 숫자 확인. 브라우저 클릭은 미실행 | 2026-09-12 | Grok tRPC |
| `/profile` 급여상세 차·대변 (보통예금 전표) | ✅ 차변 지급=대변 공제+보통예금=세전 4,200,000. 브라우저 클릭은 미실행 | 2026-09-12 | Grok tRPC |
| `/profile` 임금명세서 고용노동부 예시 칸 | ✅ core 27 · statement 대변 라벨 소득세. 칸 클릭·수당 입력은 미실행 | 2026-09-12 | Grok tRPC |
| `/profile` 08 적금내역 | ✅ upsert 월10만·3.6%·12개월 단리 만기 1,223,400. 삭제 후 0건. 브라우저 클릭 미실행 | 2026-09-12 | Grok tRPC |
| `/profile` 07 연봉 추이 12개월 | ✅ payTrend 12포인트. 9월 기본급 420만·세금 27.5만·보험 408,130. 그래프 클릭 미실행 | 2026-09-12 | Grok tRPC |
| `/profile` 09 투자내역 (계좌·자산군) | ✅ 페이지 200. holdings byClass 6칸·byAccount 검증 코인·BTC 평가 108,852. 브라우저 클릭·복수 증권 체결은 미실행 | 2026-09-12 | Grok tRPC |
| `/profile` CSV·엑셀·워드 변환 + 통장내역 + 추이 그래프 | ✅ previewFile csv/xlsx/docx, trends 12개월, listAll 6건. 브라우저 클릭은 미실행 | 2026-09-12 | Grok tRPC |
| `/chat` 렌더 + Ollama 질의 응답 | ✅ gemma4:12b. 2026-09-05: 보유 없음 정직 응답 + 뉴스 제목 인용 | 2026-09-05 | 사용자(09-02), Grok tRPC 재확인 |
| worker — RSS 국내 (한경·매경·연합) | ✅ 3/3 피드, 1차 325건 | 2026-09-02 | 사용자 실행, Claude 기록 |
| worker — RSS 해외 (CNBC×2·MarketWatch·Fed·ECB) | ✅ 5/5 피드 응답 | 2026-09-02 | 사용자 실행 |
| worker — Upbit BTC/ETH/SOL/XRP | ✅ 4 upsert | 2026-09-02 | 사용자 실행 |
| worker — ECOS (통계코드 유효성) | ⏸ 키 없음, skip 동작 확인 | 2026-09-02 | |
| worker — FRED | ⏸ 키 없음, skip 동작 확인 | 2026-09-02 | |
| worker — Yahoo (v3, SPY/QQQ/^GSPC/^IXIC) | ✅ 4/4 (v2는 429·지원종료 → v3 전환) | 2026-09-02 | 사용자 실행 |
| worker — DART (계정명 매핑) | ⏸ 키·대상 없음, skip 동작 확인 | 2026-09-02 | |
| worker — EDGAR (태그·UA) | ⏸ `SEC_USER_AGENT` 없어 skip (`SEC_USER_AGENT not set`) | 2026-09-05 | Grok |

| 모바일 Expo 기동 + 루트 .env 로드 | ❌ 미실행 | | |
| 윈도우 환경 전체 | ❌ 경로 미정 | | |

## 목록
| 날짜 | 모델/도구 | 파일 |
|---|---|---|
| 2026-09-13 | Claude (Cowork, 종합 검토) | [2026-09-13-claude.md](./2026-09-13-claude.md) |
| 2026-09-12 | Cursor Grok (투자내역) | [2026-09-12-grok-7.md](./2026-09-12-grok-7.md) |
| 2026-09-12 | Cursor Grok (연봉 추이) | [2026-09-12-grok-6.md](./2026-09-12-grok-6.md) |
| 2026-09-12 | Cursor Grok (적금내역) | [2026-09-12-grok-5.md](./2026-09-12-grok-5.md) |
| 2026-09-12 | Cursor Grok (임금명세서 양식) | [2026-09-12-grok-4.md](./2026-09-12-grok-4.md) |
| 2026-09-12 | Cursor Grok (급여상세 차대변) | [2026-09-12-grok-3.md](./2026-09-12-grok-3.md) |
| 2026-09-12 | Cursor Grok (파일 변환·추이) | [2026-09-12-grok-2.md](./2026-09-12-grok-2.md) |
| 2026-09-12 | Cursor Grok (프로필대장) | [2026-09-12-grok.md](./2026-09-12-grok.md) |
| 2026-09-08 | Cursor Grok (dev 머지 후 실행) | [2026-09-08-grok.md](./2026-09-08-grok.md) |
| 2026-09-05 | Cursor Grok (계좌·CSV) | [2026-09-05-grok-2.md](./2026-09-05-grok-2.md) |
| 2026-09-05 | Cursor Grok (리뷰 반영) | [2026-09-05-grok.md](./2026-09-05-grok.md) |
| 2026-09-02 | Cursor Grok (first-run 리뷰) | [2026-09-02-grok.md](./2026-09-02-grok.md) |
| 2026-09-02 | Claude (Cowork, 스캐폴딩) | [2026-09-02-claude.md](./2026-09-02-claude.md) |
| 2026-09-02 | Cursor | [2026-09-02-cursor.md](./2026-09-02-cursor.md) |
| 2026-09-02 | Claude (Cowork, 리뷰 검토) | [2026-09-02-claude-2.md](./2026-09-02-claude-2.md) |
