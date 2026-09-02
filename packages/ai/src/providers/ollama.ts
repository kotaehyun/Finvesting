import type { ChatMessage, LlmProvider } from "../provider";

export class OllamaProvider implements LlmProvider {
  readonly name = "ollama";
  constructor(
    private baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    private model = process.env.OLLAMA_MODEL ?? "qwen2.5:7b",
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

  async *chatStream(messages: ChatMessage[], opts?: { temperature?: number }) {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: this.model, messages, stream: true, options: { temperature: opts?.temperature ?? 0.2 } }),
    });
    if (!res.ok || !res.body) throw new Error(`ollama stream failed: ${res.status}`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const j = JSON.parse(line) as { message?: { content?: string } };
        if (j.message?.content) yield j.message.content;
      }
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
