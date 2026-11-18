# 0055 — worker 는 컨테이너 한 개로 띄울 수 있다
- 상태: 채택 (2026-11-09)
- 배경: ADR 0003은 서비스화 때 worker 를 컨테이너 1개로 두기로 했다. 인증·호스팅 DB 는 아직이다.
- 결정: 루트 `Dockerfile`은 `@finvesting/worker`만 담는다. compose 의 `worker`는 DB 주소만 `db`로 바꾸고, 기동 즉시 수집은 끈다. 비밀 파일은 이미지에 복사하지 않는다.
- 결과: 로컬 개발은 그대로 `pnpm dev:worker`. 이미지 기동은 `docker compose up -d worker`.
