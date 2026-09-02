# 데이터 수집 소스

수집기: `apps/worker`. 소스별 어댑터는 `src/sources/*.ts`, 스케줄은 `src/index.ts`.
원칙: **정식 API 우선, 크롤링은 API가 없는 것만.** 뉴스 본문은 저장하지 않는다(저작권).

## 현재 구현
| 소스 | 어댑터 | 방식 | 스케줄 | 키 | 저장 테이블 |
|---|---|---|---|---|---|
| 한국경제·매일경제·연합뉴스 RSS | `rss.ts` | RSS | 15분 | 불필요 | `market_news` |
| 업비트 BTC/ETH 일봉 | `upbit.ts` | 공개 API | 5분 | 불필요 | `market_quotes` |
| 한국은행 ECOS (환율, 기준금리, CPI, 국고채3년) | `ecos.ts` | API | 09시·18시 | `ECOS_API_KEY` | `macro_indicators` |

ECOS 통계코드는 `ecos.ts`의 `SERIES`에 있으며 ECOS 사이트에서 검증 필요(코드가 바뀌기도 함).

## 계획
| 소스 | 방식 | 용도 | 상태 |
|---|---|---|---|
| 한국투자증권 KIS Open API | API (키 필요) | 국내·해외 주식 시세 | 미구현 |
| 네이버 뉴스 검색 API | API | 종목별 뉴스 | 미구현 |
| 경제 캘린더 (예: investing.com / 금통위·FOMC 일정) | 크롤링 | `economic_events` | 미구현 |
| FRED | API | 미국 금리·CPI | 미구현 |
| 은행·카드·증권 거래내역 | CSV/엑셀 수동 업로드 | `transactions`, `trades` | 미구현 (파서 필요) |

## 어댑터 추가 방법
1. `src/sources/<name>.ts`에 `export async function collect<Name>()` 작성, `onConflictDoNothing/Update`로 멱등하게
2. `src/index.ts`의 `jobs`에 스케줄 추가, `run-once.ts`에도 추가
3. 이 문서 표 갱신

## 크롤링 주의
- robots.txt 확인, 요청 간격 두기, User-Agent 명시
- 이용약관상 금지된 사이트(증권사 HTS 데이터 등)는 크롤링하지 않음
- 저장은 제목·링크·요약·발행시각·수치까지만
