# 0002 — 로컬 Docker PostgreSQL + Drizzle
- 상태: 채택 (2026-09-02)
- 배경: 당장은 자체 로컬 사용. 맥/윈도우 양쪽에서 개발.
- 대안: SQLite(가볍지만 서비스화 시 이전 필요), Supabase(호스팅, 두 기기 데이터 공유되나 외부 저장).
- 결정: pgvector 포함 Postgres를 Docker로 로컬 실행. 서비스화 시 `DATABASE_URL`만 교체.
- 결과: 두 기기 간 DB 데이터는 자동 동기화되지 않음 → 주 작업 기기에만 실데이터. 필요 시 Supabase로 전환.
