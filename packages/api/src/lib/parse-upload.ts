import { detectTransactionImporter, genericBankImporter } from "@finvesting/interop";
import type { ImportResult, ParsedTransaction } from "@finvesting/interop";
import { uploadToRows } from "./table-file";
export { decodeText } from "./table-file";

const MAX_BYTES = 2_000_000;

export function parseUpload(filename: string, contentBase64: string): ImportResult<ParsedTransaction> {
  const buf = Buffer.from(contentBase64, "base64");
  if (!buf.length) return { rows: [], skipped: [{ line: 1, reason: "빈 파일" }], detected: "" };
  if (buf.length > MAX_BYTES) return { rows: [], skipped: [{ line: 1, reason: `파일이 ${MAX_BYTES}바이트를 넘음` }], detected: "" };

  let rows;
  try {
    rows = uploadToRows(filename, contentBase64);
  } catch (e) {
    return { rows: [], skipped: [{ line: 1, reason: e instanceof Error ? e.message : String(e) }], detected: "" };
  }

  const importer = detectTransactionImporter(rows) ?? genericBankImporter;
  const parsed = importer.parse(rows);
  if (!parsed.rows.length && !parsed.skipped.length) {
    return { rows: [], skipped: [{ line: 1, reason: "거래 행을 찾지 못함" }], detected: importer.id };
  }
  return parsed;
}
