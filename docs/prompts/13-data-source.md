# 수집 소스(어댑터) 추가 프롬프트

---

## 작업: 수집 소스 추가 — {소스 이름}

**소스**: {URL 또는 API 이름}
**방식**: {정식 API | RSS | 크롤링} — 정식 API가 있으면 반드시 그것을 우선
**키 필요 여부**: {예/아니오, 환경변수 이름}
**저장 테이블**: {market_news | market_quotes | macro_indicators | economic_events | 새 테이블}
**스케줄**: {cron 표현식과 이유}

### 진행 순서
1. `docs/tech/data-sources.md`와 기존 어댑터(`apps/worker/src/sources/*.ts`) 하나를 읽고 같은 패턴을 따른다.
2. API 문서의 엔드포인트·파라미터·응답 형식을 **실제로 확인**한다. 확인할 수 없으면 코드에 `// TODO: 확인 필요` 주석과 함께 명시한다. 지어내지 않는다.
3. 크롤링이면 robots.txt와 이용약관을 확인하고 결과를 보고한다. 요청 간격·User-Agent를 둔다. 뉴스 본문은 저장하지 않는다.
4. `collect{Name}()` 함수 작성 — 실패해도 예외를 밖으로 던져 스케줄러가 로그를 남기게 하고, 저장은 `onConflictDoNothing/Update`로 멱등하게.
5. `src/index.ts`의 `jobs`와 `src/run-once.ts`에 등록. `.env.example`에 키 항목 추가.
6. `pnpm --filter @finvesting/worker run:once`로 1회 실행해 결과를 보고한다.
7. `docs/tech/data-sources.md` 표 갱신, `docs/progress/README.md` 갱신.
