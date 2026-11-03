// `/statements` 국내·해외 보기. 첫 화면은 보유(평가액 순) → 관심 → 수집 기업.
// 검색 횟수 기록이 없으면 「인기 검색」을 만들지 않는다.

import {
  statementRegionFor,
  type StatementLookupGroup,
  type StatementRegion,
  type StatementRegionId,
  STATEMENT_REGIONS,
} from "./statement-regions";

export type StatementAreaId = "kr" | "os";

export type StatementArea = {
  id: StatementAreaId;
  title: string;
  regionIds: readonly StatementRegionId[];
};

export const STATEMENT_AREAS: readonly StatementArea[] = [
  { id: "kr", title: "국내", regionIds: ["kr"] },
  { id: "os", title: "해외", regionIds: ["us", "jp", "cn", "eu"] },
];

export type StatementBrowseKind = "holdings" | "watchlist" | "companies";

export function statementAreaById(id: StatementAreaId): StatementArea {
  return STATEMENT_AREAS.find((a) => a.id === id) ?? STATEMENT_AREAS[0]!;
}

export function statementAreaForRegion(regionId: StatementRegionId): StatementAreaId {
  return regionId === "kr" ? "kr" : "os";
}

export function regionsInArea(areaId: StatementAreaId): StatementRegion[] {
  const ids = statementAreaById(areaId).regionIds;
  return STATEMENT_REGIONS.filter((r) => (ids as readonly string[]).includes(r.id));
}

export function defaultRegionInArea(areaId: StatementAreaId): StatementRegionId {
  const rows = regionsInArea(areaId);
  return (rows.find((r) => r.active) ?? rows[0])?.id ?? "kr";
}

const NOT_STATEMENT_MARKETS = new Set(["UPBIT", "CRYPTO", "INDEX"]);

/** 해당 지역(또는 해외 전체)에 속하면 true. 코인·지수는 넣지 않음. */
export function instrumentInArea(
  input: { symbol: string; market: string },
  areaId: StatementAreaId,
): boolean {
  const market = input.market.trim().toUpperCase();
  if (NOT_STATEMENT_MARKETS.has(market)) return false;
  const region = statementRegionFor(input);
  if (!region) return false;
  return statementAreaForRegion(region.id) === areaId;
}

export function defaultStatementBrowse(opts: {
  holdingCount: number;
  watchCount: number;
}): StatementBrowseKind {
  if (opts.holdingCount > 0) return "holdings";
  if (opts.watchCount > 0) return "watchlist";
  return "companies";
}

/** 평가액(없으면 원가) 큰 순. 시세 없으면 뒤로. */
export function sortHoldingsByInvested<T extends {
  marketValueKrw?: number | null;
  costKrw?: number | null;
}>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const av = a.marketValueKrw ?? a.costKrw ?? 0;
    const bv = b.marketValueKrw ?? b.costKrw ?? 0;
    return bv - av;
  });
}

export function parseCustomCategoryTitle(raw: string): string | null {
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.slice(0, 20);
}

/** `/statements` 왼쪽 섹터. 기본 칸 + 로컬에서 숨김·이름·종목. */
export type StatementSectorPrefs = {
  hiddenIds: string[];
  titles: Record<string, string>;
  extraSymbols: Record<string, string[]>;
  removedSymbols: Record<string, string[]>;
  custom: { id: string; title: string; symbols: string[] }[];
};

export const EMPTY_SECTOR_PREFS: StatementSectorPrefs = {
  hiddenIds: [],
  titles: {},
  extraSymbols: {},
  removedSymbols: {},
  custom: [],
};

export type MergedStatementSector = {
  id: string;
  title: string;
  symbols: string[];
  builtin: boolean;
};

function uniqSymbols(xs: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of xs) {
    const s = raw.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function mergeStatementSectors(
  groups: readonly StatementLookupGroup[],
  prefs: StatementSectorPrefs,
): MergedStatementSector[] {
  const hidden = new Set(prefs.hiddenIds);
  const builtin = groups
    .filter((g) => !hidden.has(g.id))
    .map((g) => {
      const removed = new Set((prefs.removedSymbols[g.id] ?? []).map((s) => s.trim()));
      return {
        id: g.id,
        title: (prefs.titles[g.id] ?? g.title).trim() || g.title,
        symbols: uniqSymbols([
          ...g.companies.map((c) => c.symbol).filter((s) => !removed.has(s)),
          ...(prefs.extraSymbols[g.id] ?? []).filter((s) => !removed.has(s)),
        ]),
        builtin: true,
      };
    });
  const custom = prefs.custom
    .filter((c) => c?.id && c?.title)
    .map((c) => ({
      id: c.id,
      title: c.title,
      symbols: uniqSymbols(c.symbols ?? []),
      builtin: false,
    }));
  return [...builtin, ...custom];
}

/** 섹터에 심볼 넣기/빼기. 기본 칸은 extra·removed로만 덮음. */
export function toggleSectorSymbol(
  prefs: StatementSectorPrefs,
  sector: MergedStatementSector,
  symbol: string,
  builtinDefaults: readonly string[],
): StatementSectorPrefs {
  const key = symbol.trim();
  if (!key) return prefs;
  if (!sector.builtin) {
    const has = sector.symbols.includes(key);
    return {
      ...prefs,
      custom: prefs.custom.map((c) =>
        c.id !== sector.id
          ? c
          : {
            ...c,
            symbols: has ? c.symbols.filter((s) => s !== key) : uniqSymbols([...c.symbols, key]),
          },
      ),
    };
  }
  const defaults = new Set(builtinDefaults);
  const extra = new Set(prefs.extraSymbols[sector.id] ?? []);
  const removed = new Set(prefs.removedSymbols[sector.id] ?? []);
  if (sector.symbols.includes(key)) {
    extra.delete(key);
    if (defaults.has(key)) removed.add(key);
  } else {
    removed.delete(key);
    if (!defaults.has(key)) extra.add(key);
  }
  return {
    ...prefs,
    extraSymbols: { ...prefs.extraSymbols, [sector.id]: [...extra] },
    removedSymbols: { ...prefs.removedSymbols, [sector.id]: [...removed] },
  };
}
