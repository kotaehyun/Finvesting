// packages/core/data/*.json 공통 메타. 값은 JSON만 읽고, 여기서 검증·펼친다.

export const VERIFIED_BY = ["사용자", "Grok", "Codex", "미검증"] as const;
export type VerifiedBy = (typeof VERIFIED_BY)[number];

export type DataEntry = {
  id: string;
  value: number | null;
  unit: string;
  asOf: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  sourceTitle: string;
  sourceUrl: string;
  article: string | null;
  verifiedBy: VerifiedBy;
  verifiedOn: string | null;
};

export type DataDefaults = Omit<DataEntry, "id" | "value" | "unit"> & { unit?: string };

export type DataFile = {
  defaults: DataDefaults;
  entries: DataEntry[];
  [key: string]: unknown;
};

export function isVerifiedBy(v: unknown): v is VerifiedBy {
  return typeof v === "string" && (VERIFIED_BY as readonly string[]).includes(v);
}

/** 파일 기본 메타 + 항목 필드를 합쳐 DataEntry 형태로 만든다. */
export function mergeEntry(
  defaults: DataDefaults,
  partial: Partial<DataEntry> & { id: string; value: number | null },
): DataEntry {
  return {
    id: partial.id,
    value: partial.value,
    unit: partial.unit ?? defaults.unit ?? "",
    asOf: partial.asOf ?? defaults.asOf,
    effectiveFrom: partial.effectiveFrom ?? defaults.effectiveFrom,
    effectiveTo: partial.effectiveTo ?? defaults.effectiveTo,
    sourceTitle: partial.sourceTitle ?? defaults.sourceTitle,
    sourceUrl: partial.sourceUrl ?? defaults.sourceUrl,
    article: partial.article !== undefined ? partial.article : defaults.article,
    verifiedBy: partial.verifiedBy ?? defaults.verifiedBy,
    verifiedOn: partial.verifiedOn !== undefined ? partial.verifiedOn : defaults.verifiedOn,
  };
}

export function assertDataFile(file: DataFile, pathHint: string): void {
  if (!file?.defaults) throw new Error(`${pathHint}: defaults 없음`);
  if (!Array.isArray(file.entries)) throw new Error(`${pathHint}: entries 배열 없음`);
  const d = file.defaults;
  if (!d.sourceUrl || typeof d.sourceUrl !== "string") throw new Error(`${pathHint}: defaults.sourceUrl`);
  if (d.asOf === undefined) throw new Error(`${pathHint}: defaults.asOf`);
  if (!isVerifiedBy(d.verifiedBy)) throw new Error(`${pathHint}: defaults.verifiedBy`);
  for (const e of file.entries) {
    const full = mergeEntry(d, e);
    if (!full.id) throw new Error(`${pathHint}: entry id 없음`);
    if (!full.sourceUrl) throw new Error(`${pathHint}: ${full.id} sourceUrl`);
    if (full.asOf === undefined) throw new Error(`${pathHint}: ${full.id} asOf`);
    if (!isVerifiedBy(full.verifiedBy)) throw new Error(`${pathHint}: ${full.id} verifiedBy`);
  }
}

/** 객체를 돌며 number|null 잎을 entries로 만든다. 문자열·불린은 건너뜀. */
export function collectNumberEntries(
  value: unknown,
  defaults: DataDefaults,
  prefix = "",
): DataEntry[] {
  const out: DataEntry[] = [];
  const walk = (v: unknown, path: string) => {
    if (v === null) {
      if (path) out.push(mergeEntry(defaults, { id: path, value: null }));
      return;
    }
    if (typeof v === "number") {
      if (Number.isFinite(v)) out.push(mergeEntry(defaults, { id: path || "value", value: v }));
      return;
    }
    if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, path ? `${path}[${i}]` : `[${i}]`));
      return;
    }
    if (v && typeof v === "object") {
      for (const [k, child] of Object.entries(v as Record<string, unknown>)) {
        // 메타·링크 문자열 필드는 숫자 수집에서 제외하지 않음 — 숫자만 walk
        walk(child, path ? `${path}.${k}` : k);
      }
    }
  };
  walk(value, prefix);
  return out;
}
