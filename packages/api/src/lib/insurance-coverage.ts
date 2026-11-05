import { desc, eq } from "drizzle-orm";
import { financialProfiles, insurancePolicies, type Db } from "@finvesting/db";
import { analyzeCoverage, formatCoverageContext, type PolicyBrief, type PolicyCoverage } from "@finvesting/core";

function n(v: string | number | null | undefined) {
  return v != null ? Number(v) : 0;
}

export function toInsuranceClient(row: typeof insurancePolicies.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    insurer: row.insurer,
    kind: row.kind,
    monthlyPremium: n(row.monthlyPremium),
    deathAmount: n(row.deathAmount),
    medicalCovered: row.medicalCovered,
    cancerAmount: n(row.cancerAmount),
    brainAmount: n(row.brainAmount),
    heartAmount: n(row.heartAmount),
    accidentAmount: n(row.accidentAmount),
    disabilityAmount: n(row.disabilityAmount),
    startMonth: row.startMonth,
    endMonth: row.endMonth,
    memo: row.memo,
  };
}

function toCoverage(p: ReturnType<typeof toInsuranceClient>): PolicyCoverage {
  return {
    death: p.deathAmount,
    medical: p.medicalCovered,
    cancer: p.cancerAmount,
    brain: p.brainAmount,
    heart: p.heartAmount,
    accident: p.accidentAmount,
    disability: p.disabilityAmount,
  };
}

function toBrief(p: ReturnType<typeof toInsuranceClient>): PolicyBrief {
  return { ...toCoverage(p), name: p.name, kind: p.kind, monthlyPremium: p.monthlyPremium };
}

export async function loadCoverageSnapshot(db: Db, userId: string) {
  const rows = await db.select().from(insurancePolicies)
    .where(eq(insurancePolicies.userId, userId))
    .orderBy(desc(insurancePolicies.updatedAt));
  const [profile] = await db.select({ monthlyGrossIncome: financialProfiles.monthlyGrossIncome })
    .from(financialProfiles)
    .where(eq(financialProfiles.userId, userId))
    .limit(1);
  const policies = rows.map(toInsuranceClient);
  const annualIncome = n(profile?.monthlyGrossIncome) * 12;
  const coverages = policies.map(toCoverage);
  const briefs = policies.map(toBrief);
  const hex = analyzeCoverage(coverages, annualIncome, "hex");
  const hept = analyzeCoverage(coverages, annualIncome, "hept");
  return {
    policies,
    annualIncome,
    hex,
    hept,
    contextHex: formatCoverageContext(hex, annualIncome, briefs),
    contextHept: formatCoverageContext(hept, annualIncome, briefs),
  };
}
