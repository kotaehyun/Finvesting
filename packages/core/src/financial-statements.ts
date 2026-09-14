// 종목 재무제표·감사의견 표시·챗 컨텍스트. 숫자는 호출 측이 넣은 값만 쓴다.

export const FS_ITEM_LABELS: Record<string, string> = {
  revenue: "매출액",
  operating_income: "영업이익",
  net_income: "당기순이익",
  eps_diluted: "희석EPS",
  total_assets: "자산총계",
  total_liabilities: "부채총계",
  total_equity: "자본총계",
  cfo: "영업현금흐름",
};

export const FS_STATEMENT_LABELS = {
  income: "손익계산서",
  balance: "재무상태표",
  cashflow: "현금흐름표",
} as const;

export type FsStatementKind = keyof typeof FS_STATEMENT_LABELS;

export type AuditBrief = {
  fiscalYear: number;
  auditor: string | null;
  opinion: string | null;
  emphasis: string | null;
  keyAuditMatters: string | null;
  receiptNo: string | null;
};

export type StatementItems = Partial<Record<keyof typeof FS_ITEM_LABELS, number>>;

export function asStatementItems(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

export function goingConcernMentioned(...texts: Array<string | null | undefined>): boolean {
  return texts.some((t) => Boolean(t && /계속기업/.test(t)));
}

export function statementRatios(items: Record<string, number>) {
  const revenue = items.revenue;
  const op = items.operating_income;
  const ni = items.net_income;
  const assets = items.total_assets;
  const liab = items.total_liabilities;
  const equity = items.total_equity;
  const cfo = items.cfo;
  const r: Record<string, number> = {};
  if (revenue && revenue !== 0 && op != null) r.opMargin = op / revenue;
  if (revenue && revenue !== 0 && ni != null) r.netMargin = ni / revenue;
  if (assets && assets !== 0 && liab != null) r.debtToAssets = liab / assets;
  if (equity && equity !== 0 && ni != null) r.roe = ni / equity;
  if (ni != null && cfo != null) r.cfoMinusNetIncome = cfo - ni;
  return r;
}

function moneyLine(key: string, n: number, currency: string) {
  const label = FS_ITEM_LABELS[key] ?? key;
  const formatted = `${Math.round(n).toLocaleString("ko-KR")}${currency === "KRW" ? "원" : ` ${currency}`}`;
  return `- ${label} ${formatted}`;
}

export function formatAuditContext(a: AuditBrief): string {
  const lines = [
    `- 연도 ${a.fiscalYear}`,
    `- 감사인 ${a.auditor ?? "없음"}`,
    `- 감사의견 ${a.opinion ?? "없음"}`,
  ];
  if (a.emphasis) lines.push(`- 강조사항 ${a.emphasis}`);
  if (a.keyAuditMatters) lines.push(`- 핵심감사사항 ${a.keyAuditMatters}`);
  if (goingConcernMentioned(a.emphasis, a.keyAuditMatters, a.opinion)) {
    lines.push("- 계속기업 관련 문구가 위에 있다. 적정이어도 재무건전성 보장이 아니다.");
  }
  return lines.join("\n");
}

export function formatStatementContext(input: {
  symbol: string;
  name: string;
  fiscalYear: number;
  currency: string;
  income?: Record<string, number>;
  balance?: Record<string, number>;
  cashflow?: Record<string, number>;
  audit?: AuditBrief | null;
}): string {
  const merged = { ...input.income, ...input.balance, ...input.cashflow };
  const ratios = statementRatios(merged);
  const blocks: string[] = [
    `${input.name}(${input.symbol}) ${input.fiscalYear} 연결`,
  ];
  const pushStmt = (title: string, items?: Record<string, number>) => {
    if (!items || !Object.keys(items).length) return;
    blocks.push(`## ${title}\n${Object.entries(items).map(([k, n]) => moneyLine(k, n, input.currency)).join("\n")}`);
  };
  pushStmt(FS_STATEMENT_LABELS.income, input.income);
  pushStmt(FS_STATEMENT_LABELS.balance, input.balance);
  pushStmt(FS_STATEMENT_LABELS.cashflow, input.cashflow);
  if (Object.keys(ratios).length) {
    const bits: string[] = [];
    if (ratios.opMargin != null) bits.push(`영업이익률 ${(ratios.opMargin * 100).toFixed(1)}%`);
    if (ratios.netMargin != null) bits.push(`순이익률 ${(ratios.netMargin * 100).toFixed(1)}%`);
    if (ratios.debtToAssets != null) bits.push(`부채비율(자산 대비) ${(ratios.debtToAssets * 100).toFixed(1)}%`);
    if (ratios.roe != null) bits.push(`ROE ${(ratios.roe * 100).toFixed(1)}%`);
    if (ratios.cfoMinusNetIncome != null) {
      bits.push(`영업CF−순이익 ${Math.round(ratios.cfoMinusNetIncome).toLocaleString("ko-KR")}${input.currency === "KRW" ? "원" : ` ${input.currency}`}`);
    }
    blocks.push(`## 비율(컨텍스트 숫자로만 계산)\n- ${bits.join(" · ")}`);
  }
  if (input.audit) blocks.push(`## 감사의견\n${formatAuditContext(input.audit)}`);
  else blocks.push("## 감사의견\n없음");
  return blocks.join("\n\n");
}
