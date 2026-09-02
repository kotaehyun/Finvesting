# 0001 — TypeScript 모노레포 (Turborepo + pnpm)
- 상태: 채택 (2026-09-02)
- 배경: 웹 + 모바일을 혼자 개발. 세금·배분 계산 같은 도메인 로직을 양쪽에서 재사용해야 함.
- 결정: 전부 TypeScript. apps(web/mobile/worker) + packages(db/core/api/ai) 구조.
- 결과: 언어 하나, tRPC로 API 타입 공유. 대신 Python 생태계(데이터 분석)는 필요 시 별도 스크립트로.
