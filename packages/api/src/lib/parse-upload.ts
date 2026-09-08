import { csvToRows, xlsxToRows, detectTransactionImporter, genericBankImporter } from "@finvesting/interop";
import type { ImportResult, ParsedTransaction } from "@finvesting/interop";

const MAX_BYTES = 2_000_000;

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

export function parseUpload(filename: string, contentBase64: string): ImportResult<ParsedTransaction> {
  const buf = Buffer.from(contentBase64, "base64");
  if (!buf.length) return { rows: [], skipped: [{ line: 1, reason: "빈 파일" }], detected: "" };
  if (buf.length > MAX_BYTES) return { rows: [], skipped: [{ line: 1, reason: `파일이 ${MAX_BYTES}바이트를 넘음` }], detected: "" };

  const lower = filename.toLowerCase();
  const rows = (lower.endsWith(".xlsx") || lower.endsWith(".xls"))
    ? xlsxToRows(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
    : csvToRows(decodeText(buf));

  const importer = detectTransactionImporter(rows) ?? genericBankImporter;
  const parsed = importer.parse(rows);
  if (!parsed.rows.length && !parsed.skipped.length) {
    return { rows: [], skipped: [{ line: 1, reason: "거래 행을 찾지 못함" }], detected: importer.id };
  }
  return parsed;
}
