import type { LlmProvider } from "./provider";
import { OllamaProvider } from "./providers/ollama";

export * from "./provider";
export * from "./prompts";

export function createProvider(): LlmProvider {
  const kind = process.env.AI_PROVIDER ?? "ollama";
  switch (kind) {
    case "ollama": return new OllamaProvider();
    // case "vllm": return new OpenAiCompatProvider(process.env.VLLM_BASE_URL!, process.env.VLLM_MODEL!);  // DGX Spark
    // case "openai" | "anthropic": ...  // 서비스화 시
    default: throw new Error(`unknown AI_PROVIDER: ${kind}`);
  }
}
