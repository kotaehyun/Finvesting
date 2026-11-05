// 금투협 FreeSIS 메인에 있는 투자자예탁금·신용융자. 위탁매매 미수금은 메인에 없어 칸.
// 단위는 페이지의 「백만원」. 숫자를 고정 스냅샷으로 두지 않는다.

export const KOFIA_MAIN_URL = "https://freesis.kofia.or.kr/stat/main.do";
export const KOFIA_FUNDS_URL =
  "https://freesis.kofia.or.kr/stat/FreeSIS.do?parentDivId=MSIS10000000000000&serviceId=STATSCU0100000060";

export type KofiaFundSlice = {
  id: "deposit" | "credit" | "margin";
  label: string;
  millionWon: number | null;
};

export type KofiaMarketFunds = {
  asOf: string | null;
  unit: "백만원";
  source: "kofia-main";
  deposit: number | null;
  credit: number | null;
  margin: number | null;
  slices: KofiaFundSlice[];
};

function parseBlock(html: string, name: string): { md: string | null; value: number | null } {
  const re = new RegExp(
    `>${name}<\\/a>[\\s\\S]*?<span class="date">(\\d{2}\\/\\d{2})<\\/span>[\\s\\S]*?<span class="num1">([0-9,]+)<\\/span>`,
  );
  const m = html.match(re);
  if (!m?.[1] || !m[2]) return { md: null, value: null };
  const n = Number(m[2].replace(/,/g, ""));
  return { md: m[1], value: Number.isFinite(n) ? n : null };
}

export function parseKofiaYear(html: string, fallbackYear: number): number {
  const m = html.match(/\[(\d{4})-\d{2}-\d{2}\]/);
  const y = m ? Number(m[1]) : fallbackYear;
  return y >= 2000 && y <= 2100 ? y : fallbackYear;
}

export function kofiaMdToIso(md: string, year: number): string | null {
  const m = md.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return null;
  return `${year}-${m[1]}-${m[2]}`;
}

export function parseKofiaMainHtml(html: string, fallbackYear: number): KofiaMarketFunds {
  const year = parseKofiaYear(html, fallbackYear);
  const deposit = parseBlock(html, "투자자예탁금");
  const credit = parseBlock(html, "신용융자");
  const margin = parseBlock(html, "위탁매매 미수금");
  const asOf = kofiaMdToIso(deposit.md ?? credit.md ?? "", year);
  return {
    asOf,
    unit: "백만원",
    source: "kofia-main",
    deposit: deposit.value,
    credit: credit.value,
    margin: margin.value,
    slices: [
      { id: "deposit", label: "투자자예탁금", millionWon: deposit.value },
      { id: "credit", label: "신용융자", millionWon: credit.value },
      { id: "margin", label: "위탁매매 미수금", millionWon: margin.value },
    ],
  };
}

export function kofiaFundsTotal(funds: Pick<KofiaMarketFunds, "deposit" | "credit" | "margin">): number | null {
  const parts = [funds.deposit, funds.credit, funds.margin].filter((n): n is number => n != null && n >= 0);
  if (!parts.length) return null;
  return parts.reduce((a, b) => a + b, 0);
}

/** 미수금 / (예탁금+신용+있는 미수금). 미수금 칸이 없으면 null. */
export function marginShare(funds: Pick<KofiaMarketFunds, "deposit" | "credit" | "margin">): number | null {
  if (funds.margin == null || funds.margin < 0) return null;
  const total = kofiaFundsTotal(funds);
  if (total == null || total <= 0) return null;
  return funds.margin / total;
}

/** 신용융자 / (예탁금+신용). 미수금이 메인에 없을 때 외상 비중. */
export function creditShare(funds: Pick<KofiaMarketFunds, "deposit" | "credit">): number | null {
  const d = funds.deposit;
  const c = funds.credit;
  if (d == null || c == null || d + c <= 0) return null;
  return c / (d + c);
}

export function millionWonToJo(n: number): number {
  return n / 1_000_000;
}
