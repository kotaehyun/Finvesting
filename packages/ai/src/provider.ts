// LLM 프로바이더 추상화.
// 개발: Ollama(로컬 소형 모델) → 맥스튜디오: Ollama(대형 모델) → 서비스: vLLM(DGX Spark) / 클라우드 API
// 설정값(AI_PROVIDER, *_BASE_URL, *_MODEL)만 바꿔 갈아끼운다.

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface LlmProvider {
  readonly name: string;
  chat(messages: ChatMessage[], opts?: { temperature?: number; maxTokens?: number }): Promise<string>;
  chatStream?(messages: ChatMessage[], opts?: { temperature?: number }): AsyncIterable<string>;
  embed(texts: string[]): Promise<number[][]>;
}
