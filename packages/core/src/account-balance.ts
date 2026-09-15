// 통장 가져오기에서 ‘현재 잔액’으로 쓸 값을 고른다. 파일 순서(오름/내림)와 빈 칸을 고려한다.

export type BalanceHint = {
  date: string;
  balanceAfter?: number | null;
};

export type PickedBalance = {
  date: string;
  balanceAfter: number;
};

function isAmount(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

/** 가장 늦은 날짜의 잔액. 같은 날이면 파일의 시간순으로 더 늦은 행. */
export function pickLatestBalance(rows: BalanceHint[]): PickedBalance | null {
  const withBal = rows
    .map((r, i) => ({ date: r.date, balanceAfter: r.balanceAfter, i }))
    .filter((r): r is { date: string; balanceAfter: number; i: number } => isAmount(r.balanceAfter));
  if (!withBal.length) return null;

  const firstDate = rows[0]?.date;
  const lastDate = rows[rows.length - 1]?.date;
  const descending = firstDate != null && lastDate != null && firstDate > lastDate;

  let best = withBal[0]!;
  for (const r of withBal) {
    if (r.date > best.date) {
      best = r;
      continue;
    }
    if (r.date !== best.date) continue;
    if (descending ? r.i < best.i : r.i > best.i) best = r;
  }
  return { date: best.date, balanceAfter: best.balanceAfter };
}

/** 가져온 잔액 기준일이 계좌의 기존 최신 거래일보다 오래면 현재 잔액을 덮지 않는다. */
export function shouldApplyImportedBalance(importedDate: string, latestExistingDate: string | null): boolean {
  return latestExistingDate == null || importedDate >= latestExistingDate;
}
