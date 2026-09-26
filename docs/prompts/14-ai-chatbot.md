# 챗봇 · 프롬프트 · RAG 작업 프롬프트

---

## 작업: AI — {제목}

**목표**: {예: 보유 종목·현금흐름을 컨텍스트에 추가 / 뉴스 임베딩 RAG / 스트리밍 응답}

### 진행 순서
1. `docs/tech/ai.md`, `packages/ai/src/*`, `packages/api/src/routers/chat.ts`를 읽는다.
2. 프로바이더 인터페이스(`LlmProvider`)를 깨지 않는다. 특정 모델·서버 전용 코드는 프로바이더 구현체 안에만 둔다.
3. 컨텍스트 주입 시 **수치는 DB에서 가져온 것만** 넣고, 프롬프트에는 "컨텍스트에 없는 수치는 말하지 말 것"을 유지한다.
4. 시스템 프롬프트(`packages/ai/src/prompts.ts`)를 바꾸면 바꾼 이유와 전후 비교를 `docs/tech/ai.md`에 남긴다.
5. 임베딩 모델/차원을 바꾸면 `market_news.embedding` 차원 마이그레이션이 필요함을 확인한다.
6. 개발 검증은 로컬 Ollama 기준. 모델 이름은 환경변수로.
7. `/chat` 화면 이름은 투자 봇AI. 바꾸면 `docs/tech/ai.md`와 ADR 0048을 맞춘다. ChatGPT 로고·이름을 넣지 않는다.
8. `docs/tech/ai.md`, `docs/progress/README.md` 갱신.

### 챗봇 답변 원칙 (시스템 프롬프트에 유지할 것)
- 근거 있는 수치만 인용, 매수/매도 단정 금지, 리스크·대안 병기, 한국 세제 반영, 한국어·간결
