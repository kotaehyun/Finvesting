import { desc, eq } from "drizzle-orm";
import { auditReports, financialStatements, instruments, type Db } from "@finvesting/db";
import {
  asStatementItems,
  auditorSite,
  dartViewerUrl,
  formatStatementContext,
  goingConcernMentioned,
  lookupServices,
  statementRatios,
  type AuditBrief,
} from "@finvesting/core";

function toAudit(row: typeof auditReports.$inferSelect): AuditBrief {
  return {
    fiscalYear: row.fiscalYear,
    auditor: row.auditor,
    opinion: row.opinion,
    emphasis: row.emphasis,
    keyAuditMatters: row.keyAuditMatters,
    receiptNo: row.receiptNo,
  };
}

export async function listStatementInstruments(db: Db) {
  const fsRows = await db.select({
    instrumentId: financialStatements.instrumentId,
    fiscalYear: financialStatements.fiscalYear,
    source: financialStatements.source,
  }).from(financialStatements);
  const auRows = await db.select({
    instrumentId: auditReports.instrumentId,
    fiscalYear: auditReports.fiscalYear,
    source: auditReports.source,
    opinion: auditReports.opinion,
  }).from(auditReports);
  const byId = new Map<string, { years: Set<number>; sources: Set<string>; opinions: Set<string> }>();
  const touch = (instrumentId: string, fiscalYear: number, source: string) => {
    const cur = byId.get(instrumentId) ?? { years: new Set<number>(), sources: new Set<string>(), opinions: new Set<string>() };
    cur.years.add(fiscalYear);
    cur.sources.add(source);
    byId.set(instrumentId, cur);
    return cur;
  };
  for (const r of fsRows) touch(r.instrumentId, r.fiscalYear, r.source);
  for (const r of auRows) {
    const cur = touch(r.instrumentId, r.fiscalYear, r.source);
    if (r.opinion) cur.opinions.add(r.opinion);
  }
  if (!byId.size) return [];
  const insts = await db.select({
    id: instruments.id,
    symbol: instruments.symbol,
    name: instruments.name,
    market: instruments.market,
  }).from(instruments);
  return insts
    .filter((i) => byId.has(i.id))
    .map((i) => {
      const m = byId.get(i.id)!;
      return {
        ...i,
        years: [...m.years].sort((a, b) => b - a),
        sources: [...m.sources],
        opinions: [...m.opinions],
      };
    });
}

export async function loadStatementBundle(db: Db, instrumentId: string, year?: number) {
  const [inst] = await db.select({
    id: instruments.id,
    symbol: instruments.symbol,
    name: instruments.name,
    market: instruments.market,
  }).from(instruments).where(eq(instruments.id, instrumentId)).limit(1);
  if (!inst) return null;

  const fsAll = await db.select().from(financialStatements)
    .where(eq(financialStatements.instrumentId, instrumentId))
    .orderBy(desc(financialStatements.fiscalYear));
  const auAll = await db.select().from(auditReports)
    .where(eq(auditReports.instrumentId, instrumentId))
    .orderBy(desc(auditReports.fiscalYear));
  const years = [...new Set([...fsAll.map((r) => r.fiscalYear), ...auAll.map((r) => r.fiscalYear)])].sort((a, b) => b - a);
  const fiscalYear = year && years.includes(year) ? year : years[0];
  if (fiscalYear == null) {
    return {
      instrument: inst, fiscalYear: null, years, income: {}, balance: {}, cashflow: {}, ratios: {},
      audit: null, context: "", lookups: lookupServices(inst.symbol || inst.name),
    };
  }
  const fs = fsAll.filter((r) => r.fiscalYear === fiscalYear);
  const income = asStatementItems(fs.find((r) => r.statement === "income")?.items);
  const balance = asStatementItems(fs.find((r) => r.statement === "balance")?.items);
  const cashflow = asStatementItems(fs.find((r) => r.statement === "cashflow")?.items);
  const currency = fs[0]?.currency ?? "KRW";
  const au = auAll.find((r) => r.fiscalYear === fiscalYear) ?? null;
  const audit = au ? toAudit(au) : null;
  const context = formatStatementContext({
    symbol: inst.symbol, name: inst.name, fiscalYear, currency, income, balance, cashflow, audit,
  });
  return {
    instrument: inst,
    fiscalYear,
    years,
    currency,
    income,
    balance,
    cashflow,
    ratios: statementRatios({ ...income, ...balance, ...cashflow }),
    audit: audit
      ? {
        ...audit,
        goingConcern: goingConcernMentioned(audit.emphasis, audit.keyAuditMatters, audit.opinion),
        dartUrl: audit.receiptNo ? dartViewerUrl(audit.receiptNo) : null,
        auditorSite: auditorSite(audit.auditor),
      }
      : null,
    lookups: lookupServices(inst.symbol || inst.name),
    context,
  };
}
