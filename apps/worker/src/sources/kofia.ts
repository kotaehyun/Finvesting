import { db, macroIndicators } from "@finvesting/db";
import { KOFIA_MAIN_URL, parseKofiaMainHtml } from "@finvesting/core";

// 금투협 FreeSIS 메인 HTML. 미수금 칸은 메인에 없다. 본문 저장 없음.

export async function collectKofiaFunds() {
  const res = await fetch(KOFIA_MAIN_URL, { headers: { "User-Agent": "Finvesting/0.1 (personal)" } });
  if (!res.ok) return { skipped: `kofia HTTP ${res.status}` };
  const html = await res.text();
  const year = Number(new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 4));
  const funds = parseKofiaMainHtml(html, year);
  if (!funds.asOf) return { skipped: "kofia parse empty", asOf: null };
  const rows: Array<{ code: string; value: number }> = [];
  if (funds.deposit != null) rows.push({ code: "KOFIA_INVESTOR_DEPOSIT", value: funds.deposit });
  if (funds.credit != null) rows.push({ code: "KOFIA_CREDIT", value: funds.credit });
  if (funds.margin != null) rows.push({ code: "KOFIA_MARGIN", value: funds.margin });
  for (const r of rows) {
    await db.insert(macroIndicators).values({
      code: r.code, date: funds.asOf, value: String(r.value), unit: "백만원", source: "kofia",
    }).onConflictDoUpdate({
      target: [macroIndicators.code, macroIndicators.date],
      set: { value: String(r.value), fetchedAt: new Date(), source: "kofia" },
    });
  }
  return { asOf: funds.asOf, upserted: rows.length, margin: funds.margin != null };
}
