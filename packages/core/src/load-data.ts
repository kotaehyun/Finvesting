// packages/core/data/*.json 공통 메타. 값은 JSON만 읽고, 여기서 검증·펼친다.

/** verifiedBy: "사용자" | "AI:<이름>" | "미검증" */
export function isVerifiedBy(v: unknown): v is string {
  if (typeof v !== "string" || !v) return false;
  if (v === "사용자" || v === "미검증") return true;
  return /^AI:.+/.test(v);
}

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
  verifiedBy: string;
  verifiedOn: string | null;
};

export type DataDefaults = Omit<DataEntry, "id" | "value" | "unit"> & { unit?: string };

/** tax: entries 필수. realty: defaults만(+ kind:"config"). */
export type DataFile = {
  defaults: DataDefaults;
  entries?: DataEntry[];
  kind?: string;
  [key: string]: unknown;
};

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

export function assertDefaults(file: DataFile, pathHint: string): void {
  if (!file?.defaults) throw new Error(`${pathHint}: defaults 없음`);
  const d = file.defaults;
  if (!d.sourceUrl || typeof d.sourceUrl !== "string") throw new Error(`${pathHint}: defaults.sourceUrl`);
  if (d.asOf === undefined) throw new Error(`${pathHint}: defaults.asOf`);
  if (!isVerifiedBy(d.verifiedBy)) throw new Error(`${pathHint}: defaults.verifiedBy=${String(d.verifiedBy)}`);
}

/** 화면 하단 「기준 asOf · sourceTitle」. asOf 없으면 — */
export function dataSourceLine(defaults: DataDefaults): string {
  const asOf = defaults.asOf ?? "—";
  return `기준 ${asOf} · ${defaults.sourceTitle}`;
}

/** tax 파일: defaults + entries 검증. */
export function assertDataFile(file: DataFile, pathHint: string): void {
  assertDefaults(file, pathHint);
  if (!Array.isArray(file.entries)) throw new Error(`${pathHint}: entries 배열 없음`);
  const d = file.defaults;
  for (const e of file.entries) {
    const full = mergeEntry(d, e);
    if (!full.id) throw new Error(`${pathHint}: entry id 없음`);
    if (!full.sourceUrl) throw new Error(`${pathHint}: ${full.id} sourceUrl`);
    if (full.asOf === undefined) throw new Error(`${pathHint}: ${full.id} asOf`);
    if (!isVerifiedBy(full.verifiedBy)) throw new Error(`${pathHint}: ${full.id} verifiedBy=${full.verifiedBy}`);
  }
}

/** entries에서 id로 값을 읽는다. 없으면 throw. value는 number|null. */
export function getValue(file: DataFile, id: string): number | null {
  const list = file.entries;
  if (!Array.isArray(list)) throw new Error(`entries 없음: ${id}`);
  const hit = list.find((e) => e.id === id);
  if (!hit) throw new Error(`entry 없음: ${id}`);
  return hit.value;
}

/** entries에 id가 없으면 null(빈 칸). 있으면 value(number|null). */
export function optionalValue(file: DataFile, id: string): number | null {
  const list = file.entries;
  if (!Array.isArray(list)) return null;
  const hit = list.find((e) => e.id === id);
  return hit ? hit.value : null;
}

/** null·없으면 throw. */
export function requireValue(file: DataFile, id: string): number {
  const v = getValue(file, id);
  if (v == null || !Number.isFinite(v)) throw new Error(`entry 값 없음: ${id}`);
  return v;
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
        walk(child, path ? `${path}.${k}` : k);
      }
    }
  };
  walk(value, prefix);
  return out;
}
