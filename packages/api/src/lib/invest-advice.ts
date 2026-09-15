import { parseInvestStyle, buildInvestAdvice, type InvestAdvice, type RiskTolerance } from "@finvesting/core";
import { loadOverview } from "./overview";
import type { Db } from "@finvesting/db";
import { financialProfiles } from "@finvesting/db";
import { eq } from "drizzle-orm";

function asRisk(v: string | null | undefined): RiskTolerance {
  if (v === "conservative" || v === "aggressive" || v === "moderate") return v;
  return "moderate";
}

export async function loadInvestAdvice(
  db: Db,
  userId: string,
  overview = loadOverview(db, userId),
): Promise<InvestAdvice> {
  const ov = await overview;
  const [row] = await db.select({
    investStyle: financialProfiles.investStyle,
    riskTolerance: financialProfiles.riskTolerance,
  }).from(financialProfiles).where(eq(financialProfiles.userId, userId)).limit(1);

  const answers = parseInvestStyle(row?.investStyle);
  const storedRisk = asRisk(row?.riskTolerance ?? ov.profile?.riskTolerance);
  const open = ov.holdings.positions.filter((p) => p.quantity > 0);
  const investedHoldings = open.reduce((s, p) => s + (p.marketValueKrw ?? 0), 0);
  let topWeight: number | null = null;
  let topSymbol: string | null = null;
  if (investedHoldings > 0) {
    for (const p of open) {
      const w = (p.marketValueKrw ?? 0) / investedHoldings;
      if (topWeight == null || w > topWeight) {
        topWeight = w;
        topSymbol = p.symbol;
      }
    }
  }
  return buildInvestAdvice({
    answers,
    storedRisk,
    liquid: ov.assets.liquid,
    invested: ov.assets.invested,
    emergencyFundGap: ov.guide?.emergencyFundGap ?? null,
    guideNotes: ov.guide?.notes ?? [],
    byClass: ov.holdings.byClass.map((c) => ({ assetClass: c.assetClass, weight: c.weight })),
    hasUsd: open.some((p) => p.currency === "USD"),
    topWeight,
    topSymbol,
    openCount: ov.holdings.totals.openCount,
  });
}
