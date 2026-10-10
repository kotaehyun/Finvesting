export type TransactionKeyInput = {
  date: string | Date;
  amount: number | string;
  direction: string;
  memo?: string | null;
  merchant?: string | null;
};

export function dupKey(r: TransactionKeyInput): string {
  const d = r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date);
  return `${d}|${Number(r.amount)}|${r.direction}|${r.memo ?? ""}|${r.merchant ?? ""}`;
}

/**
 * 멀티셋(Multiset / Frequency count) 기반 중복 필터링.
 * 동일 날짜·동일 금액·동일 가맹점의 정상적인 반복 결제(2건 이상)를 모두 보존하면서,
 * 이미 DB에 저장된 횟수를 초과하는 건만 신규 등록하여 재업로드 시의 중복 저장을 방어한다.
 */
export function filterDuplicateTransactions<T extends TransactionKeyInput>(
  incoming: T[],
  existing: TransactionKeyInput[],
): T[] {
  const existingCounts = new Map<string, number>();
  for (const e of existing) {
    const k = dupKey(e);
    existingCounts.set(k, (existingCounts.get(k) ?? 0) + 1);
  }

  const inputCounts = new Map<string, number>();
  const toInsert: T[] = [];

  for (const r of incoming) {
    const k = dupKey(r);
    const count = (inputCounts.get(k) ?? 0) + 1;
    inputCounts.set(k, count);
    const inDb = existingCounts.get(k) ?? 0;
    if (count > inDb) {
      toInsert.push(r);
    }
  }

  return toInsert;
}
