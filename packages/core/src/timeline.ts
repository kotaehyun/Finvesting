export type FinancialEventSource = "transaction" | "trade" | "income" | "savings" | "payroll";

export type FinancialEventType =
  | "income"
  | "expense"
  | "transfer"
  | "trade_buy"
  | "trade_sell"
  | "dividend"
  | "interest"
  | "savings_deposit"
  | "payroll_statement";

export interface UnifiedFinancialEvent {
  id: string;
  sourceId: string;
  sourceType: FinancialEventSource;
  type: FinancialEventType;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm:ss
  timestamp: number; // epoch ms
  title: string;
  subtitle?: string;
  amount: number; // 표시용 환산 금액 (양수)
  originalAmount?: number;
  currency: string;
  direction: "in" | "out" | "neutral";
  category: string;
  accountName?: string;
  memo?: string;
  details?: Record<string, any>;
}

export interface RawTransactionInput {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string | null;
  amount: string | number;
  direction: "in" | "out" | "transfer";
  category: string;
  merchant?: string | null;
  memo?: string | null;
  accountName?: string | null;
  source?: string | null;
  raw?: any;
}

export interface RawTradeInput {
  id: string;
  tradedAt: string | Date;
  side: "buy" | "sell";
  quantity: string | number;
  price: string | number;
  fee?: string | number | null;
  tax?: string | number | null;
  fxRate?: string | number | null;
  symbol: string;
  name: string;
  market?: string | null;
  currency?: string | null;
  accountName?: string | null;
  memo?: string | null;
}

export interface RawIncomeInput {
  id: string;
  paidOn: string; // YYYY-MM-DD
  kind: "dividend" | "interest" | string;
  gross: string | number;
  withheldTax?: string | number | null;
  symbol?: string | null;
  name?: string | null;
  accountName?: string | null;
}

export interface RawSavingsInput {
  id: string;
  month: string; // YYYY-MM
  amount: string | number;
  planName: string;
  institution?: string | null;
  memo?: string | null;
}

export interface RawPayrollInput {
  id: string;
  month: string; // YYYY-MM
  grossAmount: string | number;
  netAmount: string | number;
  taxAmount?: string | number;
  insuranceAmount?: string | number;
  baseAmount?: string | number;
  bonusAmount?: string | number;
}

export interface TimelineInputs {
  transactions?: RawTransactionInput[];
  trades?: RawTradeInput[];
  incomes?: RawIncomeInput[];
  savings?: RawSavingsInput[];
  payrolls?: RawPayrollInput[];
}

export type TimelineTypeGroup = "all" | "cashflow" | "trade" | "income" | "savings" | "payroll";

export interface TimelineFilter {
  month?: string; // YYYY-MM
  typeGroup?: TimelineTypeGroup;
  accountId?: string;
  keyword?: string;
}

export interface TimelineSummary {
  totalIn: number;
  totalOut: number;
  netFlow: number;
  totalInvested: number;
  totalDividends: number;
  eventCount: number;
}

export interface TimelineDateGroup {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "월", "화", "수", "목", "금", "토", "일"
  events: UnifiedFinancialEvent[];
  subtotalIn: number;
  subtotalOut: number;
}

function parseEpochMs(dateStr: string, timeStr?: string | null): number {
  if (timeStr && timeStr.trim()) {
    const combined = `${dateStr}T${timeStr.trim()}`;
    const parsed = Date.parse(combined);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const parsedDate = Date.parse(`${dateStr}T12:00:00`);
  return Number.isNaN(parsedDate) ? 0 : parsedDate;
}

const KOREAN_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 분산된 금융 이벤트 소스들을 단일 UnifiedFinancialEvent 목록으로 통합 및 최신순 정렬
 */
export function buildFinancialTimeline(inputs: TimelineInputs): UnifiedFinancialEvent[] {
  const events: UnifiedFinancialEvent[] = [];

  // 1. Transactions (통장/카드 입출금 및 이체)
  if (inputs.transactions) {
    for (const txn of inputs.transactions) {
      const amt = Math.abs(Number(txn.amount) || 0);
      let eventType: FinancialEventType = "expense";
      let direction: "in" | "out" | "neutral" = "out";

      if (txn.direction === "in") {
        eventType = "income";
        direction = "in";
      } else if (txn.direction === "transfer") {
        eventType = "transfer";
        direction = "neutral";
      } else {
        eventType = "expense";
        direction = "out";
      }

      const title = txn.merchant?.trim() || txn.memo?.trim() || (txn.direction === "in" ? "입금" : txn.direction === "transfer" ? "계좌 이체" : "출금");
      const date = txn.date;
      const time = txn.time || undefined;
      const timestamp = parseEpochMs(date, time);

      events.push({
        id: `txn-${txn.id}`,
        sourceId: txn.id,
        sourceType: "transaction",
        type: eventType,
        date,
        time,
        timestamp,
        title,
        subtitle: txn.accountName || undefined,
        amount: amt,
        currency: "KRW",
        direction,
        category: txn.category || "uncategorized",
        accountName: txn.accountName || undefined,
        memo: txn.memo || undefined,
        details: {
          direction: txn.direction,
          source: txn.source,
          raw: txn.raw,
        },
      });
    }
  }

  // 2. Trades (주식/가상자산 체결)
  if (inputs.trades) {
    for (const tr of inputs.trades) {
      const qty = Number(tr.quantity) || 0;
      const price = Number(tr.price) || 0;
      const fx = Number(tr.fxRate) || 1;
      const rawTraded = tr.tradedAt instanceof Date ? tr.tradedAt.toISOString() : String(tr.tradedAt);
      const datePart = rawTraded.slice(0, 10);
      const timePart = rawTraded.length >= 19 ? rawTraded.slice(11, 19) : undefined;
      const timestamp = Date.parse(rawTraded) || parseEpochMs(datePart, timePart);

      const isBuy = tr.side === "buy";
      const totalCurAmount = Math.round(qty * price * 10000) / 10000;
      const wonAmount = Math.round(totalCurAmount * fx);

      events.push({
        id: `trade-${tr.id}`,
        sourceId: tr.id,
        sourceType: "trade",
        type: isBuy ? "trade_buy" : "trade_sell",
        date: datePart,
        time: timePart,
        timestamp,
        title: `${tr.name || tr.symbol} ${isBuy ? "매수" : "매도"}`,
        subtitle: `${qty.toLocaleString()}주 @ ${price.toLocaleString()} ${tr.currency || "KRW"}`,
        amount: wonAmount,
        originalAmount: totalCurAmount,
        currency: tr.currency || "KRW",
        direction: isBuy ? "out" : "in",
        category: "investment",
        accountName: tr.accountName || undefined,
        memo: tr.memo || undefined,
        details: {
          symbol: tr.symbol,
          market: tr.market,
          side: tr.side,
          quantity: qty,
          price,
          fee: Number(tr.fee) || 0,
          tax: Number(tr.tax) || 0,
          fxRate: fx,
        },
      });
    }
  }

  // 3. Incomes (배당금 및 이자)
  if (inputs.incomes) {
    for (const inc of inputs.incomes) {
      const gross = Math.abs(Number(inc.gross) || 0);
      const tax = Number(inc.withheldTax) || 0;
      const net = Math.max(0, gross - tax);
      const isDiv = inc.kind === "dividend";
      const timestamp = parseEpochMs(inc.paidOn);

      events.push({
        id: `income-${inc.id}`,
        sourceId: inc.id,
        sourceType: "income",
        type: isDiv ? "dividend" : "interest",
        date: inc.paidOn,
        timestamp,
        title: `${inc.name || inc.symbol || "투자"} ${isDiv ? "배당금" : "이자"}`,
        subtitle: tax > 0 ? `세후 ${net.toLocaleString()}원 (원천징수 ${tax.toLocaleString()}원)` : undefined,
        amount: gross,
        currency: "KRW",
        direction: "in",
        category: isDiv ? "dividend" : "interest",
        accountName: inc.accountName || undefined,
        details: {
          kind: inc.kind,
          gross,
          withheldTax: tax,
          net,
          symbol: inc.symbol,
        },
      });
    }
  }

  // 4. Savings (적금/예금 납입)
  if (inputs.savings) {
    for (const sav of inputs.savings) {
      const amt = Math.abs(Number(sav.amount) || 0);
      const date = `${sav.month}-25`;
      const timestamp = parseEpochMs(date);

      events.push({
        id: `savings-${sav.id}`,
        sourceId: sav.id,
        sourceType: "savings",
        type: "savings_deposit",
        date,
        timestamp,
        title: `${sav.planName} 납입`,
        subtitle: sav.institution || undefined,
        amount: amt,
        currency: "KRW",
        direction: "out",
        category: "saving",
        accountName: sav.institution || undefined,
        memo: sav.memo || undefined,
        details: {
          month: sav.month,
          institution: sav.institution,
        },
      });
    }
  }

  // 5. Payroll (급여명세서)
  if (inputs.payrolls) {
    for (const pay of inputs.payrolls) {
      const net = Math.abs(Number(pay.netAmount) || 0);
      const gross = Math.abs(Number(pay.grossAmount) || 0);
      const date = `${pay.month}-25`;
      const timestamp = parseEpochMs(date, "09:00:00");

      events.push({
        id: `payroll-${pay.id}`,
        sourceId: pay.id,
        sourceType: "payroll",
        type: "payroll_statement",
        date,
        time: "09:00:00",
        timestamp,
        title: `${pay.month} 급여 명세서`,
        subtitle: `세전 ${gross.toLocaleString()}원 · 실지급 ${net.toLocaleString()}원`,
        amount: net,
        currency: "KRW",
        direction: "neutral", // 이중 집계 방지용 중립
        category: "salary",
        details: {
          month: pay.month,
          grossAmount: gross,
          netAmount: net,
          taxAmount: Number(pay.taxAmount) || 0,
          insuranceAmount: Number(pay.insuranceAmount) || 0,
          baseAmount: Number(pay.baseAmount) || 0,
          bonusAmount: Number(pay.bonusAmount) || 0,
        },
      });
    }
  }

  // 결정적 정렬: 최신 타임스탬프 우선(내림차순) -> ID 타이 브레이커
  return events.sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return b.timestamp - a.timestamp;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * 타임라인 이벤트 필터링
 */
export function filterTimelineEvents(
  events: UnifiedFinancialEvent[],
  filter: TimelineFilter
): UnifiedFinancialEvent[] {
  return events.filter((ev) => {
    // 1. 월 필터
    if (filter.month && filter.month.trim()) {
      if (!ev.date.startsWith(filter.month.trim())) {
        return false;
      }
    }

    // 2. 유형 그룹 필터
    if (filter.typeGroup && filter.typeGroup !== "all") {
      switch (filter.typeGroup) {
        case "cashflow":
          if (ev.sourceType !== "transaction") return false;
          break;
        case "trade":
          if (ev.sourceType !== "trade") return false;
          break;
        case "income":
          if (ev.sourceType !== "income") return false;
          break;
        case "savings":
          if (ev.sourceType !== "savings") return false;
          break;
        case "payroll":
          if (ev.sourceType !== "payroll") return false;
          break;
      }
    }

    // 3. 키워드 검색
    if (filter.keyword && filter.keyword.trim()) {
      const q = filter.keyword.trim().toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchSub = ev.subtitle?.toLowerCase().includes(q);
      const matchMemo = ev.memo?.toLowerCase().includes(q);
      const matchCat = ev.category.toLowerCase().includes(q);
      const matchAcc = ev.accountName?.toLowerCase().includes(q);

      if (!matchTitle && !matchSub && !matchMemo && !matchCat && !matchAcc) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 타임라인 요약 KPI 산출
 */
export function calculateTimelineSummary(events: UnifiedFinancialEvent[]): TimelineSummary {
  let totalIn = 0;
  let totalOut = 0;
  let totalInvested = 0;
  let totalDividends = 0;

  for (const ev of events) {
    if (ev.direction === "in") {
      totalIn += ev.amount;
    } else if (ev.direction === "out") {
      totalOut += ev.amount;
    }

    if (ev.type === "trade_buy") {
      totalInvested += ev.amount;
    } else if (ev.type === "dividend") {
      totalDividends += ev.amount;
    }
  }

  return {
    totalIn,
    totalOut,
    netFlow: totalIn - totalOut,
    totalInvested,
    totalDividends,
    eventCount: events.length,
  };
}

/**
 * 이벤트를 일자별(YYYY-MM-DD)로 그룹핑
 */
export function groupTimelineByDate(events: UnifiedFinancialEvent[]): TimelineDateGroup[] {
  const map = new Map<string, UnifiedFinancialEvent[]>();

  for (const ev of events) {
    const list = map.get(ev.date) || [];
    list.push(ev);
    map.set(ev.date, list);
  }

  const groups: TimelineDateGroup[] = [];

  // 날짜 내림차순 정렬
  const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

  for (const date of sortedDates) {
    const dateEvents = map.get(date) || [];
    let subtotalIn = 0;
    let subtotalOut = 0;

    for (const ev of dateEvents) {
      if (ev.direction === "in") {
        subtotalIn += ev.amount;
      } else if (ev.direction === "out") {
        subtotalOut += ev.amount;
      }
    }

    const d = new Date(`${date}T12:00:00`);
    const dayOfWeek = Number.isNaN(d.getTime()) ? "" : (KOREAN_DAYS[d.getDay()] || "");

    groups.push({
      date,
      dayOfWeek,
      events: dateEvents,
      subtotalIn,
      subtotalOut,
    });
  }

  return groups;
}
