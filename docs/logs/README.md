# logs — 실행 로그 · 오류 기록

오류를 만나면 아래 형식으로 파일 하나씩 추가한다: `YYYY-MM-DD-짧은제목.md`
같은 오류를 두 번 겪지 않는 것이 목적. AI 도구는 오류를 만나면 **먼저 이 폴더를 검색**한다.

## 형식
```
# 제목
- 날짜:
- 환경: 맥북 / 윈도우, Node·pnpm 버전
- 어디서: 명령어 또는 화면
- 증상: 오류 메시지 원문
- 원인:
- 해결: 실제로 효과 있었던 조치
- 재발 방지: (있으면)
```

## 목록
| 날짜 | 제목 | 상태 |
|---|---|---|
| 2026-09-16 | 부동산 가상 통계·헤드라인 | 해결 (공표·칸만) |
| 2026-09-15 | MapLibre GeoJSON 워커 URL (Next) | 해결 |
| 2026-09-14 | TradingView technical-analysis S&P 「데이터 없음」 | 해결 (`SP:SPX`) |
| 2026-09-14 | 웹 React 19 / 모바일 React 18 타입 충돌 | 해결 |
| 2026-09-14 | TradingView iframe contentWindow is not available | 해결 |
| 2026-09-14 | TradingView symbol-overview 「잘못된 심볼」 | 해결 |
| 2026-09-02 | File 'expo/tsconfig.base' not found | 해결 |
| 2026-09-02 | 대시보드 월 종료일 Postgres date 오류 | 해결 |
| 2026-09-02 | drizzle-kit `Cannot find module ./common.js` + `url: undefined` | 해결 |
| 2026-09-02 | worker `DATABASE_URL is not set` (env.ts 경로 한 단계 부족) | 해결 |
| 2026-09-02 | 챗봇 한글 IME Enter 이중 전송 + 흰 글자/흰 배경 | 해결 |
