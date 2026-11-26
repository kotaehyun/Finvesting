/**
 * 예전에 KRX로 덮인 코스닥 종목 1회 정리.
 * 기본은 dry-run(목록만). APPLY=1 이면 근거 있는 행만 UPDATE.
 * 근거: market_news.raw·investment 가져오기 등 jsonb에 symbol+market=KOSDAQ이 남은 경우.
 * 근거 없으면 바꾸지 않는다.
 *
 * 실행: pnpm --filter @finvesting/worker exec tsx src/scripts/repair-kosdaq-market.ts
 * 적용: APPLY=1 pnpm --filter @finvesting/worker exec tsx src/scripts/repair-kosdaq-market.ts
 */
import "../lib/env.js";
import { eq } from "drizzle-orm";
import {
  collectKosdaqEvidenceFromRaw,
  isKrStockSymbol,
  planKosdaqMarketRepair,
  type MarketEvidence,
} from "@finvesting/core";
import { db, instruments, trades, transactions } from "@finvesting/db";

async function loadEvidence(): Promise<MarketEvidence[]> {
  const out: MarketEvidence[] = [];
  // 가져오기 원본·메모에 symbol+market=KOSDAQ이 남은 경우만. 뉴스·시세는 시장 근거가 아니다.
  const txRows = await db.select({ raw: transactions.raw }).from(transactions).limit(2_000);
  for (const row of txRows) {
    if (row.raw == null) continue;
    out.push(...collectKosdaqEvidenceFromRaw(row.raw, "transactions.raw"));
  }
  const tradeRows = await db.select({ memo: trades.memo }).from(trades).limit(2_000);
  for (const row of tradeRows) {
    if (!row.memo?.trim()) continue;
    try {
      out.push(...collectKosdaqEvidenceFromRaw(JSON.parse(row.memo), "trades.memo"));
    } catch {
      // 일반 메모는 무시
    }
  }
  return out;
}

async function main() {
  const apply = process.env.APPLY === "1";
  const rows = await db.select({
    id: instruments.id,
    symbol: instruments.symbol,
    market: instruments.market,
  }).from(instruments);

  const krxSix = rows.filter(
    (r) => isKrStockSymbol(r.symbol) && r.market.trim().toUpperCase() === "KRX",
  );
  const evidence = await loadEvidence();
  const plan = planKosdaqMarketRepair(krxSix, evidence);

  const restore = plan.filter((p) => p.action === "restore");
  const skip = plan.filter((p) => p.action === "skip");

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    candidates: krxSix.length,
    evidenceCount: evidence.length,
    restore: restore.length,
    skip: skip.length,
    restoreRows: restore,
    skipSample: skip.slice(0, 30),
  }, null, 2));

  if (!apply) {
    console.log("적용하려면 APPLY=1 로 다시 실행. 근거 없는 행은 바꾸지 않는다.");
    process.exit(0);
  }

  for (const row of restore) {
    if (row.action !== "restore") continue;
    await db.update(instruments).set({ market: "KOSDAQ" }).where(eq(instruments.id, row.id));
    console.log(`updated ${row.symbol} ${row.from} → KOSDAQ (${row.reason})`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
