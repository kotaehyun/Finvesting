# AI (투자 비서 챗봇)

## 목표
수집한 뉴스·시세·거시지표 + 본인 자산·현금흐름·보유 종목을 컨텍스트로, 로컬 LLM과 대화하며 투자 판단을 돕는다. 금융 데이터가 외부로 나가지 않는 것이 핵심 가치.

## 프로바이더 (`packages/ai`)
`LlmProvider` 인터페이스(`chat`, `chatStream`, `embed`) 뒤에 구현을 숨긴다. `AI_PROVIDER` 환경변수로 선택.

| 단계 | 하드웨어 | 프로바이더 | 모델 예 |
|---|---|---|---|
| 지금 | 맥북 | Ollama | 채팅 `gemma4:12b` (대안: `exaone3.5:7.8b` 한국어 특화). 보유 중: qwen2.5-coder:32b, gemma4:31b/e4b — 맥북에선 느려 보류. 임베딩 `nomic-embed-text`(768차원)는 RAG 단계에서 pull |
| 연말 | 맥스튜디오 M5 Ultra (도입 고려) | Ollama | 70B급 |
| 서비스화 | DGX Spark (도입 고려) | vLLM (OpenAI 호환) — `OpenAiCompatProvider` 추가 예정 | |

임베딩 차원을 바꾸면 `market_news.embedding` vector 차원도 마이그레이션 필요.

## 현재 구현
- `packages/api/src/routers/chat.ts`: 최근 뉴스 15건 + 거시지표 20건을 컨텍스트로 주입해 `chat()` 호출
- 시스템 프롬프트: `packages/ai/src/prompts.ts` — 근거 없는 수치 금지, 매수/매도 단정 금지, 한국 세제 반영
- 웹 UI: `/chat`

## 계획
1. 컨텍스트 확장: 보유 포지션·평가손익, 이번 달 현금흐름, 배분 가이드 결과
2. RAG: worker가 뉴스 저장 시 임베딩 생성 → 질문과 유사한 뉴스만 검색해 주입 (pgvector `<=>`)
3. 스트리밍 응답 (`chatStream`)
4. 대화 기록 저장 테이블 (`chat_sessions`, `chat_messages`)
5. 이상 지출 탐지, 리스크 설명 등 능동 알림
