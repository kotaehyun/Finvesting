// 통장 가져오기에서 ‘현재 잔액’으로 쓸 값을 고른다. 파일 순서(오름/내림), 거래 시각, 잔액 흐름을 고려한다.

export type BalanceHint = {
  date: string;
  time?: string | null;
  balanceAfter?: number | null;
  amount?: number | null;
  direction?: "in" | "out" | null;
};

export type PickedBalance = {
  date: string;
  balanceAfter: number;
  time?: string;
};

function isAmount(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

/**
 * 파일의 시간순 정렬 방향(내림차순: 최신이 위 vs 오름차순: 최신이 아래)을 판별한다.
 * 1) 날짜 차이
 * 2) 동일 일자 내 시간(time) 차이
 * 3) 거래 금액(amount, direction)과 잔액(balanceAfter)의 변화 흐름 역산
 */
export function detectOrder(rows: BalanceHint[]): "desc" | "asc" | "ambiguous" {
  // 1. 날짜가 다르면 첫 날짜와 마지막 날짜 비교
  const dates = rows.map((r) => r.date).filter(Boolean);
  if (dates.length >= 2) {
    const first = dates[0]!;
    const last = dates[dates.length - 1]!;
    if (first > last) return "desc";
    if (first < last) return "asc";
  }

  // 2. 날짜가 같으면 시간(time) 비교
  const times = rows.map((r) => r.time).filter((t): t is string => Boolean(t));
  if (times.length >= 2) {
    const firstTime = times[0]!;
    const lastTime = times[times.length - 1]!;
    if (firstTime > lastTime) return "desc";
    if (firstTime < lastTime) return "asc";
  }

  // 3. 거래 금액과 잔액 변화로 전후 역산 검증
  for (let i = 0; i < rows.length - 1; i++) {
    const curr = rows[i]!;
    const next = rows[i + 1]!;
    if (curr.balanceAfter != null && next.balanceAfter != null && curr.amount != null && curr.direction != null) {
      const delta = curr.direction === "in" ? curr.amount : -curr.amount;
      // 내림차순(curr이 최신, next가 직전): next.balanceAfter + delta == curr.balanceAfter
      if (Math.abs((next.balanceAfter + delta) - curr.balanceAfter) < 0.01) {
        return "desc";
      }
      // 오름차순(curr이 직전, next가 최신): curr.balanceAfter + deltaNext == next.balanceAfter
      if (next.amount != null && next.direction != null) {
        const deltaNext = next.direction === "in" ? next.amount : -next.amount;
        if (Math.abs((curr.balanceAfter + deltaNext) - next.balanceAfter) < 0.01) {
          return "asc";
        }
      }
    }
  }

  return "ambiguous";
}

/**
 * 가장 늦은 날짜(및 시간)의 최신 잔액을 선택한다.
 * 동일 일자에 잔액이 여러 개이고 순서를 판별할 수 없는 경우 안전하게 null을 반환(잔액 반영 보류)하거나 explicitOrder를 따른다.
 */
export function pickLatestBalance(rows: BalanceHint[], explicitOrder?: "asc" | "desc"): PickedBalance | null {
  const withBal = rows
    .map((r, i) => ({ ...r, i }))
    .filter((r): r is BalanceHint & { balanceAfter: number; i: number } => isAmount(r.balanceAfter));
  if (!withBal.length) return null;

  // 1. 가장 늦은 날짜 찾기
  let maxDate = withBal[0]!.date;
  for (const r of withBal) {
    if (r.date > maxDate) maxDate = r.date;
  }
  const onMaxDate = withBal.filter((r) => r.date === maxDate);

  // 해당 일자에 잔액 행이 1개뿐이면 그 잔액이 최신
  if (onMaxDate.length === 1) {
    return { date: maxDate, balanceAfter: onMaxDate[0]!.balanceAfter, time: onMaxDate[0]!.time ?? undefined };
  }

  // 해당 일자의 모든 잔액이 동일하면 그 잔액 반환
  const firstBal = onMaxDate[0]!.balanceAfter;
  if (onMaxDate.every((r) => r.balanceAfter === firstBal)) {
    return { date: maxDate, balanceAfter: firstBal, time: onMaxDate[0]!.time ?? undefined };
  }

  // 해당 일자 행들에 시간(time)이 명시되어 있는 경우, 시간 기준 최신 선택
  const withTime = onMaxDate.filter((r) => r.time);
  if (withTime.length >= 2) {
    let best = withTime[0]!;
    for (const r of withTime) {
      if ((r.time ?? "") > (best.time ?? "")) best = r;
    }
    return { date: maxDate, balanceAfter: best.balanceAfter, time: best.time ?? undefined };
  }

  // 2. 정렬 방향 판별
  const order = explicitOrder ?? detectOrder(rows);
  if (order === "desc") {
    // 내림차순 파일: 상단 행(i가 가장 작은 행)이 최신 거래
    const best = onMaxDate.reduce((min, r) => (r.i < min.i ? r : min), onMaxDate[0]!);
    return { date: maxDate, balanceAfter: best.balanceAfter, time: best.time ?? undefined };
  }
  if (order === "asc") {
    // 오름차순 파일: 하단 행(i가 가장 큰 행)이 최신 거래
    const best = onMaxDate.reduce((max, r) => (r.i > max.i ? r : max), onMaxDate[0]!);
    return { date: maxDate, balanceAfter: best.balanceAfter, time: best.time ?? undefined };
  }

  // 순서를 데이터만으로 알 수 없는 단일 일자의 상이한 잔액인 경우:
  // 잘못된 잔액으로 계좌를 덮어쓰지 않도록 null 반환 (반영 보류)
  return null;
}

/** 가져온 잔액 기준일이 계좌의 기존 최신 거래일보다 오래면 현재 잔액을 덮지 않는다. */
export function shouldApplyImportedBalance(importedDate: string, latestExistingDate: string | null): boolean {
  return latestExistingDate == null || importedDate >= latestExistingDate;
}
