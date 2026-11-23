# 2026-11-23 — localhost:5432와 Colima finvesting-db가 다름

## 증상
- 워커 DART 수집 후 `docker exec finvesting-db`로 보면 `fetched_at`이 안 바뀜.
- 같은 시각 워커(`DATABASE_URL=localhost:5432/finvesting`)로 보면 행이 갱신됨.

## 원인
- Docker CLI context는 `colima` → 컨테이너 `finvesting-db`(예: 172.18.0.2).
- 호스트 `localhost:5432`를 받는 프로세스는 `com.docker`(Docker Desktop 쪽) → 다른 Postgres(예: inet 172.20.0.2, postmaster 시작 시각이 Colima와 수 초 차이).
- `finvesting-db`를 stop해도 localhost:5432가 살아 있으면 후자가 남아 있는 것.

## 대응
- 앱·워커·검증은 **항상 `DATABASE_URL` 연결**으로 확인한다. Colima exec만으로 “안 됐다”고 단정하지 않는다.
- 하나로 맞출지는 사용자 결정(Desktop DB 폐기 또는 Colima만 publish).
