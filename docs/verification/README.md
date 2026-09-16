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
✅ 실행 확인 · ⏸ 키/대상 없어 보류(코드 경로는 skip까지 확인) · ❌ 아무도 실행 안 함 · ⚠️ 실행했으나 실패
| 항목 | 상태 | 마지막 검증 | 누가 |
|---|---|---|---|
| `pnpm install` | ✅ | 2026-09-02 | Cursor |
| 타입체크 (web 포함 8패키지) | ✅ 통과. 웹은 `@types/react` 19만 해석 | 2026-09-16 | Gemini |
| core 테스트 (vitest) | ✅ 45개 파일 147개 테스트 전건 통과 | 2026-09-16 | Gemini |
| interop 테스트 | ✅ 11개 통과 | 2026-09-14 | Grok |
| `pnpm db:generate` / `db:migrate` | ✅ `0007_cloudy_star_brand` (`invest_style`) 적용 | 2026-09-14 | Grok |
| seed SQL 적용 (extensions, default user) | ✅ | 2026-09-02 | 사용자(맥 터미널) |
| `pnpm --filter @finvesting/web build` | ✅ Compiled, `/fundamentals` 포함 15 라우트 빌드 통과 | 2026-09-16 | Gemini |
| 홈 `/` 개편 (월 선택·현금흐름·확인할 일) | ✅ 데스크톱. 평가손익 **+7,382원** 빨강. 2026-08은 현재 순자산 구분·거래 없음 문구. 모바일 390px 스택. 빈 계정 온보딩은 DB에 계좌 있어 미확인 | 2026-09-15 | Grok Chrome |
| `/invest` 투자 대시보드 | ✅ 검색 관심 추가 AAPL 332.27 USD. 평가손익 `+7,382원` 빨강 | 2026-09-15 | Grok Chrome |
| `/fundamentals` Yahoo 펀더멘털 표 | ✅ 4대 KPI 요약 바롬터, 자산군/시장 다중 필터, 전 컬럼 정렬, 저PBR/우량ROE 뱃지, 52주 게이지, 네이버/DART/AI 링크 연동 및 DB 오프라인 방어 폴백 확인 | 2026-09-16 | Gemini |
| `/markets` 시장 (물가·금리·거래량·수급링크·크립토/외환·TA) | ✅ 인플레 16칸. BIS 금리 17칸(한 2.75·미 3.63·튀르키예 37). 히트맵·뉴스 | 2026-09-14 | Grok Chrome |
| `/realty` 부동산 | ✅ tRPC 500 에러 완전 해소(200 OK). ECOS 151Y003 스냅샷 폴백. 개인회생·파산 원인별 통계, 경매 유찰률 4대 카드, 뉴스 그리드, 대출규제 3D 맵 정상 렌더링 확인 | 2026-09-16 | Gemini Playwright |
| `/profile` 프로필대장 + `workspaceSave`/`previewPay` | ✅ 페이지 200, 저장 추가·삭제 원상복구, 4대보험 미리보기 숫자 확인. 브라우저 클릭은 미실행 | 2026-09-12 | Grok tRPC |
| `/profile` 급여상세 차·대변 (보통예금 전표) | ✅ 차변 지급=대변 공제+보통예금=세전 4,200,000. 브라우저 클릭은 미실행 | 2026-09-12 | Grok tRPC |
| `/profile` 임금명세서 고용노동부 예시 칸 | ✅ core 27 · statement 대변 라벨 소득세. 칸 클릭·수당 입력은 미실행 | 2026-09-12 | Grok tRPC |
| `/profile` 08 적금내역 | ✅ upsert 월10만·3.6%·12개월 단리 만기 1,223,400. 삭제 후 0건. 브라우저 클릭 미실행 | 2026-09-12 | Grok tRPC |
| `/profile` 07 연봉 추이 12개월 | ✅ payTrend 12포인트. 연말정산 연 합 명세·과세표준 기초 브라우저 | 2026-09-15 | Grok Chrome |
| `/profile` 09 투자내역 (계좌·자산군) | ✅ 페이지 200. 손익 `+7,382원` 빨강(+7.5%). 브라우저 클릭 확인. 복수 증권 체결은 미실행 | 2026-09-15 | Grok Chrome |
| `/profile` 10 보험내역 (육각·칠각) | ✅ 페이지 200. 검증 실손 저장. 실손 100% · 암 60% · 사망 0%(부족 2.52억). 육각 중대질병 1억. **메뉴 번호는 2026-09-14부터 11** | 2026-09-13 | Grok Chrome |
| `/profile` 10 AI 추천 (`insurance.recommend`) | ✅ tRPC·브라우저. 사망→뇌·심장·상해·장해→암. 실손 됨. ~46–56초 | 2026-09-13 | Grok Ollama |
| `/profile` 10 투자성향·조언 | ✅ 페이지 200. 저장 0/12 보수 → 5/12 중립. 01 성향 동기화. BTC·비상금 문장. AI 추천 미실행. **메뉴 번호 11→10, 투자내역 다음** | 2026-09-14 | Grok Chrome |
| `/news` 뉴스 대시보드 | ✅ 페이지 200. 2026-09-14 feed 1246. 분류 654/210/50/200/55/30/47 (경제·금융·부동산·시황·크립토·외환·중앙은행) | 2026-09-14 | Grok tRPC+Chrome |
| `/opinions` 오피니언·칼럼 | ✅ 143=66/32/45. RSS 5피드 수집. 3열·애널리스트 필터 브라우저 | 2026-09-13 | Grok Chrome |
| `/statements` 재무제표·감사 | ✅ 페이지 200. 조회 카드 + drcr·DART 개황 클릭 확인. list 0. 읽어주기 실데이터 미실행 | 2026-09-13 | Grok Chrome |
| `/profile` CSV·엑셀·워드 변환 + 통장내역 + 추이 그래프 | ✅ previewFile csv/xlsx/docx, trends 12개월, listAll 6건. 브라우저 클릭은 미실행 | 2026-09-12 | Grok tRPC |
| `/chat` 렌더 + Ollama 질의 응답 | ✅ gemma4:12b. 2026-09-05: 보유 없음 정직 응답 + 뉴스 제목 인용 | 2026-09-05 | 사용자(09-02), Grok tRPC 재확인 |
| `/chat` 대화 목록 12문항 | ✅ 5그룹 버튼. 「순자산 구성」 클릭 후 순자산 3,749,802·투자 104,802 인용 | 2026-09-13 | Grok Chrome |
| worker — RSS 국내 (한경·매경·연합) | ✅ 한경·연합 수집. 2026-09-14 mk `ENOTFOUND www.mk.co.kr` | 2026-09-14 | Grok collectRssNews |
| worker — RSS 해외 (CNBC×2·MarketWatch·Fed·ECB) | ✅ 5/5 피드 응답 | 2026-09-02 | 사용자 실행 |
| worker — RSS 크립토·외환·부동산 | ✅ CoinDesk 25, Cointelegraph 30, FXStreet 30, 한경 부동산 50 | 2026-09-14 | Grok collectRssNews |
| worker — Upbit (보유·관심 ∪ UPBIT_TARGETS) | ✅ 보유 BTC만 1 upsert. 종가 104,802,000 (2026-09-13). 구버전 고정 4종은 09-02 | 2026-09-13 | Grok run:once |
| worker — ECOS (통계코드 유효성) | ⏸ 키 없음, skip. 2026-09-15 가계대출 수집도 `ECOS_API_KEY not set` | 2026-09-15 | Grok collectEcos |
| worker — FRED | ⏸ 키 없음, skip 동작 확인 | 2026-09-02 | |
| worker — Yahoo (보유·관심 + KRW=X USDKRW) | ✅ 13/13 (지수10+AAPL/MSFT/SPY). 이후 지수 chart 90일 624봉. 펀더멘털 주식·ETF만. USDKRW yahoo | 2026-09-14 | Grok collectYahoo |
| 대시보드 투자자산 = 평가액+예수금 | ✅ overview invested 104,802 = 평가 104,802 + 예수금 0. 브라우저 문구는 미클릭 | 2026-09-13 | Grok tRPC |
| worker — DART (계정명 매핑) | ⏸ 키·대상 없음, skip 동작 확인 | 2026-09-02 | |
| worker — EDGAR (태그·UA) | ⏸ `SEC_USER_AGENT` 없어 skip (`SEC_USER_AGENT not set`) | 2026-09-05 | Grok |
| worker — 세계은행 CPI | ✅ 16/16 upsert. 한 2.12%(2025) 미 2.95%(2024) | 2026-09-14 | Grok collectWorldBankInflation |
| worker — BIS 정책금리 | ✅ 14 upsert / 3 stale(DE·FR·IT). KR 2.75 US 3.625 XM 2.25 | 2026-09-14 | Grok collectBisPolicyRates |
| Yahoo 기업 검색 | ✅ `005930`→005930.KS. Chrome `AAPL`→Apple Inc. 나스닥. 한글 회사명 Yahoo 400 | 2026-09-14 | Grok Chrome 재기동 |

| 모바일 Expo 기동 + 루트 .env 로드 | ❌ 미실행 | | |
| 윈도우 환경 전체 | ✅ `pnpm install`, core 139개·interop 11개 테스트, 8개 패키지 typecheck, build, dev:web 브라우저 렌더 확인 (DB는 Docker 미기동) | 2026-09-15 | Gemini |

## 목록
| 날짜 | 모델/도구 | 파일 |
|---|---|---|
| 2026-09-15 | Gemini (맥 최신 작업 윈도우 교차 검증) | [2026-09-15-gemini.md](./2026-09-15-gemini.md) |
| 2026-09-15 | Codex (백엔드·AI 방향 문서화) | [2026-09-15-codex.md](./2026-09-15-codex.md) |
| 2026-09-15 | Cursor Grok (관심·Fundamentals·연말정산) | [2026-09-15-grok-2.md](./2026-09-15-grok-2.md) |
| 2026-09-15 | Cursor Grok (평가손익 부호·색) | [2026-09-15-grok.md](./2026-09-15-grok.md) |
| 2026-09-14 | Cursor Grok (실행해봐 재기동) | [2026-09-14-grok-9.md](./2026-09-14-grok-9.md) |
| 2026-09-14 | Cursor Grok (원자재·검색·금리) | [2026-09-14-grok-8.md](./2026-09-14-grok-8.md) |
| 2026-09-14 | Cursor Grok (시장·부동산) | [2026-09-14-grok-7.md](./2026-09-14-grok-7.md) |
| 2026-09-14 | Cursor Grok (비트코인·환율) | [2026-09-14-grok-6.md](./2026-09-14-grok-6.md) |
| 2026-09-14 | Cursor Grok (주요 지수 그래프) | [2026-09-14-grok-5.md](./2026-09-14-grok-5.md) |
| 2026-09-14 | Cursor Grok (홈·투자 대시보드) | [2026-09-14-grok-4.md](./2026-09-14-grok-4.md) |
| 2026-09-14 | Codex (문서·현재 구현 검토) | [2026-09-14-codex.md](./2026-09-14-codex.md) |
| 2026-09-14 | Cursor Grok (투자 화면 연결) | [2026-09-14-grok-3.md](./2026-09-14-grok-3.md) |
| 2026-09-14 | Cursor Grok (프로필 투자성향) | [2026-09-14-grok-2.md](./2026-09-14-grok-2.md) |
| 2026-09-14 | Cursor Grok (Yahoo 펀더멘털) | [2026-09-14-grok.md](./2026-09-14-grok.md) |
| 2026-09-13 | Cursor Grok (투자 대시보드) | [2026-09-13-grok-11.md](./2026-09-13-grok-11.md) |
| 2026-09-13 | Cursor Grok (오피니언 대시보드) | [2026-09-13-grok-10.md](./2026-09-13-grok-10.md) |
| 2026-09-13 | Cursor Grok (조회·해설 사이트) | [2026-09-13-grok-9.md](./2026-09-13-grok-9.md) |
| 2026-09-13 | Cursor Grok (재무제표 읽어주기) | [2026-09-13-grok-8.md](./2026-09-13-grok-8.md) |
| 2026-09-13 | Cursor Grok (뉴스 카테고리) | [2026-09-13-grok-7.md](./2026-09-13-grok-7.md) |
| 2026-09-13 | Cursor Grok (뉴스 대시보드) | [2026-09-13-grok-6.md](./2026-09-13-grok-6.md) |
| 2026-09-13 | Cursor Grok (보험 AI 추천) | [2026-09-13-grok-5.md](./2026-09-13-grok-5.md) |
| 2026-09-13 | Cursor Grok (보험 보장 레이더) | [2026-09-13-grok-4.md](./2026-09-13-grok-4.md) |
| 2026-09-13 | Cursor Grok (투자 비서 대화 목록) | [2026-09-13-grok-3.md](./2026-09-13-grok-3.md) |
| 2026-09-13 | Cursor Grok (워커 시세·USDKRW 실행) | [2026-09-13-grok-2.md](./2026-09-13-grok-2.md) |
| 2026-09-13 | Cursor Grok (시세 대상·USDKRW·투자자산) | [2026-09-13-grok.md](./2026-09-13-grok.md) |
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

## 2026-09-15 Codex 교차 검증
| 항목 | 상태 | 기록 |
|---|---|---|
| Windows 타입 검사 / 단위 테스트 | ✅ 8패키지 / 150개 통과 | [기록](./2026-09-15-codex-2.md) |
| 금융 원장 경계 사례 | ⚠️ 소수 매도·동일 시각 정렬·하루치 잔액 오류 재현 | [리뷰](../review/2026-09-15-codex-ledger.md) |
