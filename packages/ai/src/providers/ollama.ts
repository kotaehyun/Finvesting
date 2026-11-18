import type { ChatMessage, LlmProvider } from "../provider";
import { ollamaChatDelta } from "../ollama-delta";

export class OllamaProvider implements LlmProvider {
  readonly name = "ollama";
  constructor(
    private baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    private model = process.env.OLLAMA_MODEL ?? "gemma4:12b",
    private embedModel = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text",
  ) {}

  async chat(messages: ChatMessage[], opts?: { temperature?: number }) {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: this.model, messages, stream: false, options: { temperature: opts?.temperature ?? 0.2 } }),
    });
    if (!res.ok) throw new Error(`ollama chat failed: ${res.status}`);
    const json = (await res.json()) as { message: { content: string } };
    return json.message.content;
  }

  async *chatStream(messages: ChatMessage[], opts?: { temperature?: number; signal?: AbortSignal }) {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: this.model, messages, stream: true, options: { temperature: opts?.temperature ?? 0.2 } }),
      signal: opts?.signal,
    });
    if (!res.ok || !res.body) throw new Error(`ollama stream failed: ${res.status}`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    const take = (block: string, flush: boolean) => {
      const lines = block.split("\n");
      const rest = flush ? "" : (lines.pop() ?? "");
      const deltas: string[] = [];
      for (const line of lines) {
        const content = ollamaChatDelta(line);
        if (content) deltas.push(content);
      }
      return { deltas, rest };
    };
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const step = take(buf, false);
        buf = step.rest;
        for (const delta of step.deltas) yield delta;
      }
      buf += dec.decode();
      for (const delta of take(buf, true).deltas) yield delta;
    } finally {
      reader.releaseLock();
    }
  }

  async embed(texts: string[]) {
    const res = await fetch(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: this.embedModel, input: texts }),
    });
    if (!res.ok) throw new Error(`ollama embed failed: ${res.status}`);
    const json = (await res.json()) as { embeddings: number[][] };
    return json.embeddings;
  }
}
