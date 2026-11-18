# 검증 — 2026-11-09 Cursor (worker 컨테이너)

## 실행한 것
- `docker compose build worker` 성공. 이미지 `finvesting-worker`
- `docker compose run -d --no-deps` 후 로그에 스케줄 12줄. `ok` 수집 로그는 없음. 컨테이너는 바로 삭제

## 못 한 것
- `docker compose up -d worker` 로 DB에 붙인 채 장시간 실행
- 인증, 호스팅 DB 이전
