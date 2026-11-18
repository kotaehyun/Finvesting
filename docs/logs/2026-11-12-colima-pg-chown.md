# Colima에서 Postgres chown이 거절됨
- 날짜: 2026-11-12
- 환경: 맥북, Colima, `pgvector/pgvector:pg16`, 볼륨 `./pgdata`
- 어디서: `pnpm db:up` 다음 `collectNaverNews`
- 증상: 컨테이너 로그 `chown: changing ownership of '/var/lib/postgresql/data/...': Operation not permitted`. `pg_isready`는 no response. 앱은 `ECONNREFUSED` 다음 `ECONNRESET`
- 원인: 엔트리포인트가 root로 `find ... -exec chown postgres`를 도는데, Colima 마운트에서 chown이 거절된다. `pgdata` 주인은 호스트 uid 501
- 해결: `docker stop`·`docker rm finvesting-db` 후 `docker compose run -d --no-deps --name finvesting-db --user 501:20 --service-ports db`. 그 다음 `pg_isready` accepting connections
- 재발 방지: `docker compose up`만 하면 root 엔트리포인트가 다시 chown을 탄다. 같은 볼륨이면 `--user 501:20`으로 띄운다
