import { detectTableFileKind, fileToRows } from "@finvesting/interop";

/** UTF-8 BOM이면 UTF-8, 아니면 EUC-KR을 먼저 시도하고 한글이 더 많이 나온 쪽을 고른다. */
export function decodeText(buf: Buffer): string {
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(buf.subarray(3));
  }
  const utf = new TextDecoder("utf-8").decode(buf);
  let euc = utf;
  try { euc = new TextDecoder("euc-kr").decode(buf); } catch { /* Node가 euc-kr을 모르면 UTF-8 */ }
  const hangul = (s: string) => (s.match(/[가-힣]/g) ?? []).length;
  const bad = (s: string) => (s.match(/\uFFFD/g) ?? []).length;
  if (bad(utf) === 0 && hangul(utf) >= hangul(euc)) return utf;
  if (bad(euc) < bad(utf) || hangul(euc) > hangul(utf)) return euc;
  return utf;
}

export function uploadToRows(filename: string, contentBase64: string): string[][] {
  const buf = Buffer.from(contentBase64, "base64");
  if (!buf.length) throw new Error("빈 파일입니다");
  const kind = detectTableFileKind(filename);
  const text = kind === "csv" || kind === "unknown" ? decodeText(buf) : undefined;
  return fileToRows(filename, buf, text);
}

export function toBase64(data: Uint8Array) {
  return Buffer.from(data).toString("base64");
}
