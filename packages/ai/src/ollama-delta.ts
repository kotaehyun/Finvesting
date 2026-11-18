/** Ollama `/api/chat` 스트림 한 줄에서 이번 토큰만 꺼낸다. 빈 줄은 빈 문자열. */
export function ollamaChatDelta(line: string): string {
  if (!line.trim()) return "";
  const parsed = JSON.parse(line) as { message?: { content?: string } };
  return parsed.message?.content ?? "";
}
