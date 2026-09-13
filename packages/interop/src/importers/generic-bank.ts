import type { TransactionImporter, ParsedTransaction } from "../types";
import { toNumber, toIsoDate } from "../parse-file";

// 범용 통장 내보내기 파서: 헤더에서 날짜/입금/출금/내용/잔액 컬럼을 이름으로 찾는다.
// 은행별 전용 파서는 detect가 더 구체적인 것을 먼저 등록.
const COLS = {
  date: ["거래일", "거래일시", "일자", "날짜"],
  in: ["입금", "입금액", "맡기신금액"],
  out: ["출금", "출금액", "찾으신금액"],
  memo: ["내용", "적요", "거래내용", "기재내용"],
  merchant: ["거래처", "상대", "받는분", "보낸분", "가맹점"],
  balance: ["잔액", "거래후잔액"],
};
export const BANK_CSV_HEADER = ["거래일", "입금", "출금", "내용", "잔액"] as const;

const find = (headers: string[], keys: string[]) => headers.findIndex((h) => keys.some((k) => h.replace(/\s/g, "").includes(k)));

export const genericBankImporter: TransactionImporter = {
  id: "generic-bank",
  label: "범용 통장 내보내기 (CSV/XLSX)",
  detect(headers) { return find(headers, COLS.date) >= 0 && (find(headers, COLS.in) >= 0 || find(headers, COLS.out) >= 0); },
  parse(rows) {
    const h = rows.findIndex((r) => find(r, COLS.date) >= 0 && (find(r, COLS.in) >= 0 || find(r, COLS.out) >= 0));
    if (h < 0) return { rows: [], skipped: [{ line: 1, reason: "헤더 없음" }], detected: "generic-bank" };
    const headers = rows[h] ?? [];
    const ix = { date: find(headers, COLS.date), in: find(headers, COLS.in), out: find(headers, COLS.out), memo: find(headers, COLS.memo), merchant: find(headers, COLS.merchant), balance: find(headers, COLS.balance) };
    const out: ParsedTransaction[] = []; const skipped: Array<{ line: number; reason: string }> = [];
    rows.slice(h + 1).forEach((r, i) => {
      const line = h + 2 + i;
      const date = toIsoDate(r[ix.date] ?? "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return skipped.push({ line, reason: "날짜 없음" });
      const inAmt = ix.in >= 0 ? toNumber(r[ix.in] ?? "") : 0;
      const outAmt = ix.out >= 0 ? toNumber(r[ix.out] ?? "") : 0;
      if (!inAmt && !outAmt) return skipped.push({ line, reason: "금액 없음" });
      out.push({
        date, amount: inAmt || outAmt, direction: inAmt ? "in" : "out",
        memo: ix.memo >= 0 ? r[ix.memo] : undefined, merchant: ix.merchant >= 0 ? r[ix.merchant] : undefined,
        balanceAfter: ix.balance >= 0 ? toNumber(r[ix.balance] ?? "") : undefined,
        raw: Object.fromEntries(headers.map((k, j) => [k, r[j] ?? ""])),
      });
    });
    return { rows: out, skipped, detected: "generic-bank" };
  },
};
