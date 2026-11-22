// 손실 매도 뒤 같은 계좌·같은 종목 재매수. 2회 이상만 「반복」으로 본다.
// 제품 규칙이며 공표 통계·가치 판단이 아니다. 실현손익식은 portfolio와 같다.
import {
  compareTradesForReplay,
  QUANTITY_EPSILON,
  roundQuantity,
  type TradeReplayItem,
} from "./portfolio";

/** 같은 패턴이 이 횟수 미만이면 목록에 넣지 않는다. */
export const REPEAT_MISTAKE_MIN_COUNT = 2;

export type RepeatMistakeTrade = TradeReplayItem & {
  accountId: string;
  accountName?: string | null;
  symbol: string;
  name?: string | null;
};

export type RepeatMistakeSample = {
  sellAt: string;
  buyAt: string;
  realizedPnlKrw: number;
};

export type RepeatMistakePattern = {
  accountId: string;
  accountName: string | null;
  instrumentId: string;
  symbol: string;
  name: string | null;
  count: number;
  lastBuyAt: string;
  samples: RepeatMistakeSample[];
};

export type RepeatMistakeResult = {
  status: "empty" | "insufficient" | "ok";
  minCount: number;
  patterns: RepeatMistakePattern[];
};

function isoDay(value: Date | string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s.slice(0, 10) : d.toISOString().slice(0, 10);
}

function won(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

type Running = {
  quantity: number;
  avgCost: number;
  avgFxRate: number;
};

type PendingLoss = {
  sellAt: string;
  realizedPnlKrw: number;
};

function emptyResult(status: RepeatMistakeResult["status"]): RepeatMistakeResult {
  return { status, minCount: REPEAT_MISTAKE_MIN_COUNT, patterns: [] };
}

function groupKey(accountId: string, instrumentId: string) {
  return `${accountId}\0${instrumentId}`;
}

/** 계좌×종목마다 손실 매도 다음 매수를 센다. 2회 이상만 돌려준다. */
export function detectRepeatMistakes(trades: readonly RepeatMistakeTrade[]): RepeatMistakeResult {
  if (trades.length === 0) return emptyResult("empty");

  const groups = new Map<string, RepeatMistakeTrade[]>();
  for (const t of trades) {
    if (!t.accountId || !t.instrumentId) continue;
    if (t.side !== "buy" && t.side !== "sell") continue;
    if (!Number.isFinite(t.quantity) || t.quantity <= 0) continue;
    if (!Number.isFinite(t.price) || t.price < 0) continue;
    const key = groupKey(t.accountId, t.instrumentId);
    const rows = groups.get(key) ?? [];
    rows.push(t);
    groups.set(key, rows);
  }
  if (groups.size === 0) return emptyResult("empty");

  const patterns: RepeatMistakePattern[] = [];
  for (const rows of groups.values()) {
    const sorted = [...rows].sort(compareTradesForReplay);
    const pos: Running = { quantity: 0, avgCost: 0, avgFxRate: 1 };
    let pending: PendingLoss | null = null;
    const samples: RepeatMistakeSample[] = [];
    let symbol = sorted[0]!.symbol;
    let name: string | null = sorted[0]!.name?.trim() ? sorted[0]!.name!.trim() : null;
    let accountName: string | null = sorted[0]!.accountName?.trim() ? sorted[0]!.accountName!.trim() : null;
    const accountId = sorted[0]!.accountId;
    const instrumentId = sorted[0]!.instrumentId;

    for (const t of sorted) {
      if (t.symbol) symbol = t.symbol;
      if (t.name?.trim()) name = t.name.trim();
      if (t.accountName?.trim()) accountName = t.accountName.trim();
      const fee = (t.fee ?? 0) + (t.tax ?? 0);
      const fx = t.fxRate ?? 1;

      if (t.side === "buy") {
        if (pending) {
          samples.push({
            sellAt: pending.sellAt,
            buyAt: isoDay(t.tradedAt),
            realizedPnlKrw: pending.realizedPnlKrw,
          });
          pending = null;
        }
        const prevCost = pos.avgCost * pos.quantity;
        const addCost = t.price * t.quantity + fee;
        const newQty = roundQuantity(pos.quantity + t.quantity);
        pos.avgFxRate = newQty > 0 ? (prevCost * pos.avgFxRate + addCost * fx) / (prevCost + addCost || 1) : 1;
        pos.avgCost = newQty > 0 ? (prevCost + addCost) / newQty : 0;
        pos.quantity = newQty;
        continue;
      }

      // sell
      const diff = t.quantity - pos.quantity;
      if (diff > QUANTITY_EPSILON / 2) {
        // 보유보다 많은 매도는 재생을 멈추지 않고 이 건만 건너뛴다.
        continue;
      }
      const isFullSell = Math.abs(diff) <= QUANTITY_EPSILON / 2;
      const qty = isFullSell ? pos.quantity : t.quantity;
      const realizedPnlKrw = (t.price * qty - fee) * fx - pos.avgCost * qty * pos.avgFxRate;
      if (isFullSell) {
        pos.quantity = 0;
        pos.avgCost = 0;
        pos.avgFxRate = 1;
      } else {
        pos.quantity = roundQuantity(pos.quantity - qty);
      }
      if (realizedPnlKrw < 0) {
        pending = { sellAt: isoDay(t.tradedAt), realizedPnlKrw };
      } else {
        pending = null;
      }
    }

    if (samples.length < REPEAT_MISTAKE_MIN_COUNT) continue;
    const last = samples[samples.length - 1]!;
    patterns.push({
      accountId,
      accountName,
      instrumentId,
      symbol,
      name,
      count: samples.length,
      lastBuyAt: last.buyAt,
      samples: samples.slice(-5),
    });
  }

  patterns.sort((a, b) => b.count - a.count || b.lastBuyAt.localeCompare(a.lastBuyAt) || a.symbol.localeCompare(b.symbol));
  if (patterns.length === 0) return emptyResult("insufficient");
  return { status: "ok", minCount: REPEAT_MISTAKE_MIN_COUNT, patterns };
}

/** 챗·화면에 넣을 문장. 실수라고 단정하지 않는다. */
export function formatRepeatMistakeContext(result: RepeatMistakeResult): string {
  const head = `손실 실현 뒤 같은 계좌·같은 종목을 다시 산 횟수만 셉니다. ${result.minCount}회 이상만 반복으로 봅니다. 이익 매도·손익 0은 빼 둡니다. 실수라고 단정하지 않습니다.`;
  if (result.status === "empty") return `${head}\n체결이 없습니다.`;
  if (result.status === "insufficient") {
    return `${head}\n${result.minCount}회 이상인 종목이 없습니다.`;
  }
  const lines = result.patterns.map((p) => {
    const label = p.name ? `${p.symbol} (${p.name})` : p.symbol;
    const acct = p.accountName ? ` · ${p.accountName}` : "";
    const parts = [`- ${label}${acct}: ${p.count}회 (최근 재매수 ${p.lastBuyAt})`];
    for (const s of p.samples) {
      parts.push(`  - 손실 매도 ${s.sellAt} ${won(s.realizedPnlKrw)} → 재매수 ${s.buyAt}`);
    }
    return parts.join("\n");
  });
  return `${head}\n${lines.join("\n")}`;
}
