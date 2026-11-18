/** 뉴스 임베딩에 넣는 글. 제목과 요약만. 본문은 넣지 않는다. */
export const NEWS_EMBED_DIM = 768;
export const NEWS_EMBED_MODEL = "nomic-embed-text";

export function newsEmbedInput(title: string, summary?: string | null): string {
  const head = title.trim();
  const tail = (summary ?? "").replace(/\s+/g, " ").trim().slice(0, 500);
  return tail ? `${head}\n${tail}` : head;
}

export function isNewsEmbedVector(value: readonly number[] | null | undefined): value is number[] {
  return Array.isArray(value) && value.length === NEWS_EMBED_DIM && value.every((n) => Number.isFinite(n));
}
