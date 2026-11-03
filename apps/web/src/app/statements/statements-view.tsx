"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  FS_ITEM_LABELS,
  FS_STATEMENT_LABELS,
  defaultRegionInArea,
  defaultStatementBrowse,
  EMPTY_SECTOR_PREFS,
  filterInstrumentsByQuery,
  filingVenueFor,
  formatMcapLabel,
  instrumentInArea,
  instrumentQueryKey,
  lookupServicesForRegion,
  matchInstrumentQuery,
  mergeStatementSectors,
  parseCustomCategoryTitle,
  rankByMarketCap,
  regionsInArea,
  sortHoldingsByInvested,
  statementAreaById,
  statementAreaForRegion,
  statementLookupGroups,
  statementRegionById,
  statementRegionFor,
  statementRegionForQuery,
  toggleSectorSymbol,
  STATEMENT_AREAS,
  STATEMENT_SIDE_SLOTS,
  type StatementAreaId,
  type StatementRegion,
  type StatementSectorPrefs,
} from "@finvesting/core";
import { trpc } from "@/lib/trpc";

type ListItem = {
  id: string;
  symbol: string;
  name: string;
  market: string;
  years: number[];
  sources: string[];
  opinions: string[];
  marketCap?: number | null;
  mcapRank?: number;
  currency?: string;
};

const won = (n: number, currency: string) =>
  currency === "KRW"
    ? `${Math.round(n).toLocaleString("ko-KR")}원`
    : `${n.toLocaleString("en-US")} ${currency}`;

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const PREF_KEY = "finvesting.statement-sector-prefs";
const OLD_CAT_KEY = "finvesting.statement-custom-cats";
type BrowseKey = "holdings" | "watchlist" | "companies" | "mcap" | `sector:${string}`;
type FolderId = "market" | "view" | "sector" | "filing";

function normalizePrefs(raw: unknown): StatementSectorPrefs {
  const p = raw as Partial<StatementSectorPrefs> | null;
  return {
    hiddenIds: Array.isArray(p?.hiddenIds) ? p.hiddenIds.filter((x) => typeof x === "string") : [],
    titles: p?.titles && typeof p.titles === "object" ? p.titles : {},
    extraSymbols: p?.extraSymbols && typeof p.extraSymbols === "object" ? p.extraSymbols : {},
    removedSymbols: p?.removedSymbols && typeof p.removedSymbols === "object" ? p.removedSymbols : {},
    custom: Array.isArray(p?.custom)
      ? p.custom.filter((c) => c?.id && c?.title).map((c) => ({
        id: c.id,
        title: c.title,
        symbols: Array.isArray(c.symbols) ? c.symbols.filter((s) => typeof s === "string") : [],
      }))
      : [],
  };
}

function loadPrefs(area: StatementAreaId): StatementSectorPrefs {
  if (typeof window === "undefined") return EMPTY_SECTOR_PREFS;
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    const all = raw ? JSON.parse(raw) as Record<string, unknown> : {};
    if (all[area]) return normalizePrefs(all[area]);
    const oldRaw = window.localStorage.getItem(OLD_CAT_KEY);
    const oldAll = oldRaw ? JSON.parse(oldRaw) as Record<string, { id: string; title: string }[]> : {};
    const old = Array.isArray(oldAll[area]) ? oldAll[area] : [];
    if (!old.length) return EMPTY_SECTOR_PREFS;
    return {
      ...EMPTY_SECTOR_PREFS,
      custom: old.filter((c) => c?.id && c?.title).map((c) => ({ ...c, symbols: [] })),
    };
  } catch {
    return EMPTY_SECTOR_PREFS;
  }
}

function savePrefs(area: StatementAreaId, prefs: StatementSectorPrefs) {
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    const all = raw ? JSON.parse(raw) as Record<string, StatementSectorPrefs> : {};
    all[area] = prefs;
    window.localStorage.setItem(PREF_KEY, JSON.stringify(all));
  } catch { /* 로컬만. 실패해도 화면은 유지 */ }
}

function Folder({
  label,
  open,
  onToggle,
  extra,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  extra?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="statements-folder-block">
      <div className="statements-folder-row">
        <button type="button" className={`statements-folder${open ? " open" : ""}`} onClick={onToggle}>
          <span className="chev" aria-hidden>{open ? "▾" : "▸"}</span>
          {label}
        </button>
        {extra}
      </div>
      {open ? children : null}
    </div>
  );
}

function mergeCollected(
  row: { id: string; symbol: string; name: string; market: string },
  collected: ListItem[],
): ListItem {
  const key = instrumentQueryKey(row.symbol);
  const hit = collected.find((c) => c.id === row.id)
    ?? collected.find((c) => instrumentQueryKey(c.symbol) === key);
  return hit ?? { ...row, years: [], sources: [], opinions: [] };
}

function parseInitialBrowse(raw: string | undefined): BrowseKey | null {
  if (!raw) return null;
  if (raw === "holdings" || raw === "watchlist" || raw === "companies" || raw === "mcap") return raw;
  if (raw.startsWith("sector:")) return raw as BrowseKey;
  return null;
}

export function StatementsView({
  q,
  initialArea,
  initialBrowse,
}: {
  q: string;
  initialArea?: string;
  initialBrowse?: string;
}) {
  const qParam = q.trim();
  const startBrowse = parseInitialBrowse(initialBrowse?.trim());
  const startArea: StatementAreaId =
    initialArea === "os" || initialArea === "kr" ? initialArea : "kr";
  const router = useRouter();
  const pathname = usePathname();
  const list = trpc.statements.list.useQuery();
  const holdingsQ = trpc.trades.holdings.useQuery();
  const watchQ = trpc.market.watchlist.useQuery();
  const fundQ = trpc.market.fundamentals.useQuery();
  const items = list.data?.items ?? [];
  const loadStatus = list.data?.status;
  const [search, setSearch] = useState(qParam);
  const [areaId, setAreaId] = useState<StatementAreaId>(startArea);
  const [regionId, setRegionId] = useState(defaultRegionInArea(startArea));
  const [browse, setBrowse] = useState<BrowseKey>(startBrowse ?? "companies");
  const [prefs, setPrefs] = useState<StatementSectorPrefs>(EMPTY_SECTOR_PREFS);
  const [folder, setFolder] = useState<FolderId>("view");
  const [editing, setEditing] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [browseReady, setBrowseReady] = useState(Boolean(startBrowse));

  useEffect(() => {
    setSearch(qParam);
  }, [qParam]);

  useEffect(() => {
    setPrefs(loadPrefs(areaId));
    setEditing(false);
    setRenameId(null);
  }, [areaId]);

  const searchTrim = search.trim();
  const filtered = filterInstrumentsByQuery(items, searchTrim);
  const exact = searchTrim ? matchInstrumentQuery(items, searchTrim) : undefined;
  const listReady = loadStatus === "ok" || loadStatus === "empty";
  const searchMiss = Boolean(listReady && searchTrim && items.length > 0 && filtered.length === 0);
  const emptyMiss = Boolean(listReady && searchTrim && items.length === 0);
  const exactRegion = exact ? statementRegionFor(exact) : null;
  const missRegion = !exact && searchTrim ? statementRegionForQuery(searchTrim) : null;

  const area = statementAreaById(areaId);
  const areaRegions = regionsInArea(areaId);
  const region = statementRegionById(regionId);
  const groups = statementLookupGroups(region.id);
  const sectors = mergeStatementSectors(groups, prefs);
  const sectorId = browse.startsWith("sector:") ? browse.slice(7) : null;
  const activeSector = sectorId ? sectors.find((s) => s.id === sectorId) : undefined;

  const collectedInRegion = items.filter((i) => statementRegionFor(i)?.id === region.id);

  const holdingRows = sortHoldingsByInvested(
    (holdingsQ.data?.positions ?? []).filter((p) => instrumentInArea(p, areaId)
      && (areaId === "kr" || statementRegionFor(p)?.id === regionId)),
  );
  const watchRows = (watchQ.data ?? []).filter((p) => instrumentInArea(p, areaId)
    && (areaId === "kr" || statementRegionFor(p)?.id === regionId));

  useEffect(() => {
    if (browseReady) return;
    if (holdingsQ.isLoading || watchQ.isLoading) return;
    if (qParam || startBrowse) {
      setBrowseReady(true);
      return;
    }
    setBrowse(defaultStatementBrowse({
      holdingCount: holdingRows.length,
      watchCount: watchRows.length,
    }));
    setBrowseReady(true);
  }, [browseReady, holdingsQ.isLoading, watchQ.isLoading, qParam, startBrowse, holdingRows.length, watchRows.length]);

  useEffect(() => {
    if (!searchTrim) return;
    if (exactRegion) {
      setAreaId(statementAreaForRegion(exactRegion.id));
      setRegionId(exactRegion.id);
    } else if (missRegion?.active) {
      setAreaId(statementAreaForRegion(missRegion.id));
      setRegionId(missRegion.id);
    }
  }, [searchTrim, exactRegion?.id, missRegion?.id, missRegion?.active]);

  useEffect(() => {
    if (search === qParam) return;
    const t = window.setTimeout(() => {
      const url = searchTrim ? `${pathname}?q=${encodeURIComponent(searchTrim)}` : pathname;
      router.replace(url, { scroll: false });
    }, 350);
    return () => window.clearTimeout(t);
  }, [search, searchTrim, qParam, pathname, router]);

  const mcapRows = rankByMarketCap(
    (fundQ.data?.status === "ok" ? fundQ.data.items : [])
      .filter((f) => instrumentInArea(f, areaId)
        && (areaId === "kr" || statementRegionFor(f)?.id === regionId)),
  );

  const workItems: ListItem[] = (() => {
    if (browse === "holdings") {
      return holdingRows.map((p) => mergeCollected({
        id: p.instrumentId, symbol: p.symbol, name: p.name, market: p.market,
      }, items));
    }
    if (browse === "watchlist") {
      return watchRows.map((p) => mergeCollected({
        id: p.instrumentId, symbol: p.symbol, name: p.name, market: p.market,
      }, items));
    }
    if (browse === "mcap") {
      return mcapRows.map((r) => {
        const base = mergeCollected({
          id: r.instrumentId, symbol: r.symbol, name: r.name, market: r.market,
        }, items);
        return { ...base, marketCap: r.marketCap, mcapRank: r.rank, currency: r.currency };
      });
    }
    if (browse === "companies") {
      return filterInstrumentsByQuery(collectedInRegion, searchTrim);
    }
    if (activeSector) {
      const keys = new Set(activeSector.symbols.map((s) => instrumentQueryKey(s)));
      return filterInstrumentsByQuery(
        collectedInRegion.filter((i) => keys.has(instrumentQueryKey(i.symbol))),
        searchTrim,
      );
    }
    return filterInstrumentsByQuery(collectedInRegion, searchTrim);
  })();

  const filingQuery = exact?.symbol
    ?? (missRegion?.id === region.id ? searchTrim : undefined)
    ?? workItems[0]?.symbol;
  const filingLinks = region.venue ? lookupServicesForRegion(region, filingQuery) : [];
  const qKey = searchTrim ? instrumentQueryKey(searchTrim) : "";

  const browseTitle = browse === "holdings" ? "보유 · 평가액 순"
    : browse === "watchlist" ? "관심목록"
    : browse === "companies" ? "기업"
    : browse === "mcap" ? `시가총액 · ${areaId === "kr" ? "국내" : region.title}`
    : activeSector?.title ?? "보기";

  function companyLabel(symbol: string): string {
    const key = instrumentQueryKey(symbol);
    for (const g of groups) {
      const hit = g.companies.find((c) => instrumentQueryKey(c.symbol) === key);
      if (hit) return hit.name;
    }
    const hit = items.find((i) => instrumentQueryKey(i.symbol) === key);
    return hit?.name ?? symbol;
  }

  function commitPrefs(next: StatementSectorPrefs) {
    setPrefs(next);
    savePrefs(areaId, next);
  }

  function selectSymbol(symbol: string) {
    setSearch(symbol);
    router.replace(`${pathname}?q=${encodeURIComponent(symbol)}`, { scroll: false });
  }

  function openArea(next: StatementAreaId) {
    const rid = defaultRegionInArea(next);
    setAreaId(next);
    setRegionId(rid);
    setSearch("");
    const holds = (holdingsQ.data?.positions ?? []).filter((p) => instrumentInArea(p, next));
    const watches = (watchQ.data ?? []).filter((p) => instrumentInArea(p, next));
    setBrowse(defaultStatementBrowse({ holdingCount: holds.length, watchCount: watches.length }));
    setFolder("view");
  }

  function addCategory() {
    const title = parseCustomCategoryTitle(newCat);
    if (!title) return;
    if (sectors.some((s) => s.title === title)) { setNewCat(""); return; }
    const row = { id: `c${Date.now()}`, title, symbols: [] as string[] };
    commitPrefs({ ...prefs, custom: [...prefs.custom, row] });
    setNewCat("");
    setFolder("sector");
    setBrowse(`sector:${row.id}`);
  }

  function applyRename() {
    const title = parseCustomCategoryTitle(renameVal);
    if (!title || !renameId) { setRenameId(null); return; }
    const builtin = groups.some((g) => g.id === renameId);
    if (builtin) {
      commitPrefs({ ...prefs, titles: { ...prefs.titles, [renameId]: title } });
    } else {
      commitPrefs({
        ...prefs,
        custom: prefs.custom.map((c) => (c.id === renameId ? { ...c, title } : c)),
      });
    }
    setRenameId(null);
  }

  function removeSector(id: string, builtin: boolean) {
    if (builtin) {
      commitPrefs({ ...prefs, hiddenIds: [...new Set([...prefs.hiddenIds, id])] });
    } else {
      commitPrefs({ ...prefs, custom: prefs.custom.filter((c) => c.id !== id) });
    }
    if (browse === `sector:${id}`) setBrowse("companies");
  }

  if (list.isLoading) {
    return <p className="muted" style={{ padding: 20 }}>불러오는 중…</p>;
  }

  return (
    <div className="erp wehago">
      <div className="erp-titlebar">
        <h1>
          <span className="wehago-mark" aria-hidden>공시</span>
          재무제표 · 기업정보
          <span className="path">
            {area.title}
            {areaId === "os" ? ` · ${region.title}` : ""}
            {` · ${browseTitle}`}
            {searchTrim ? ` · ${searchTrim}` : ""}
          </span>
        </h1>
        <div className="wehago-title-meta">
          <a href="/fundamentals">Fundamentals</a>
          <a href="/invest">투자</a>
          <a href="/">자산 홈</a>
        </div>
      </div>

      <div className="erp-toolbar">
        <label>
          수집 검색
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="AAPL, 005930…"
            aria-label="수집된 재무제표 종목 검색"
            autoComplete="off"
            disabled={loadStatus === "empty" && !items.length}
            style={{ width: 180, marginLeft: 6 }}
          />
        </label>
        {filtered.slice(0, 5).map((h) => (
          <button key={h.id} type="button" onClick={() => selectSymbol(h.symbol)}>
            {h.symbol}
          </button>
        ))}
        <span className="sep" />
        <span className="erp-hint" style={{ margin: 0 }}>
          수집분만. Yahoo 전 종목은 <a href="/invest">/invest</a>. 숫자는 공시 표준 항목만.
        </span>
      </div>

      {loadStatus === "unavailable" && (
        <p className="erp-caution" style={{ margin: 8 }}>DB 연결 불가. 고정 샘플은 쓰지 않습니다.</p>
      )}
      {loadStatus === "empty" && (
        <p className="erp-hint" style={{ padding: "8px 12px" }}>
          수집된 재무제표가 없습니다. `DART_*` / `EDGAR_*` 후 `pnpm --filter @finvesting/worker run:once`.
        </p>
      )}
      {(searchMiss || emptyMiss) && (
        <p className="erp-caution" style={{ margin: 8 }}>
          {searchTrim} 수집분 없음. 왼쪽 「공시」에서 원문만 열 수 있습니다. 다른 종목 숫자를 이 종목처럼 보이지 않습니다.
        </p>
      )}

      {listReady && region && (
        <div className="erp-body statements-erp-body">
          <nav className="erp-menu statements-menu" aria-label="재무제표 메뉴">
            <div className="statements-area">
              {STATEMENT_AREAS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={areaId === a.id ? "on" : ""}
                  onClick={() => openArea(a.id)}
                >
                  {a.title}
                </button>
              ))}
            </div>

            <div className="statements-tree">
              {areaId === "os" && (
                <Folder
                  label="시장"
                  open={folder === "market"}
                  onToggle={() => setFolder(folder === "market" ? "view" : "market")}
                >
                  {areaRegions.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={`lv2${region.id === r.id ? " on" : ""}`}
                      onClick={() => { setRegionId(r.id); setSearch(""); setBrowse("companies"); setFolder("view"); }}
                    >
                      {r.title}
                    </button>
                  ))}
                </Folder>
              )}

              <Folder
                label="보기"
                open={folder === "view"}
                onToggle={() => setFolder(folder === "view" ? "sector" : "view")}
              >
                <button type="button" className={`lv2${browse === "holdings" ? " on" : ""}`} onClick={() => { setBrowse("holdings"); setSearch(""); }}>
                  보유<span className="statements-cat-sym">{holdingRows.length}</span>
                </button>
                <button type="button" className={`lv2${browse === "watchlist" ? " on" : ""}`} onClick={() => { setBrowse("watchlist"); setSearch(""); }}>
                  관심목록<span className="statements-cat-sym">{watchRows.length}</span>
                </button>
                <button type="button" className={`lv2${browse === "companies" ? " on" : ""}`} onClick={() => { setBrowse("companies"); setSearch(""); }}>
                  기업<span className="statements-cat-sym">{collectedInRegion.length}</span>
                </button>
                <button type="button" className={`lv2${browse === "mcap" ? " on" : ""}`} onClick={() => { setBrowse("mcap"); setSearch(""); }}>
                  시가총액<span className="statements-cat-sym">{mcapRows.length}</span>
                </button>
              </Folder>

              <Folder
                label="섹터"
                open={folder === "sector"}
                onToggle={() => setFolder(folder === "sector" ? "view" : "sector")}
              >
                <button
                  type="button"
                  className={`lv2 statements-edit-row${editing ? " on" : ""}`}
                  onClick={() => { setEditing((v) => !v); setRenameId(null); }}
                >
                  {editing ? "편집 끝" : "편집"}
                </button>
                {sectors.map((s) => {
                  const open = browse === `sector:${s.id}`;
                  const builtinDefaults = groups.find((g) => g.id === s.id)?.companies.map((c) => c.symbol) ?? [];
                  return (
                    <div key={s.id} className="statements-branch">
                      {renameId === s.id ? (
                        <form
                          className="statements-add lv2"
                          onSubmit={(e) => { e.preventDefault(); applyRename(); }}
                        >
                          <input
                            value={renameVal}
                            onChange={(e) => setRenameVal(e.target.value)}
                            aria-label={`${s.title} 이름 바꾸기`}
                            maxLength={20}
                            autoFocus
                            onBlur={applyRename}
                          />
                        </form>
                      ) : (
                        <div className={`statements-item${open ? " on" : ""}`}>
                          <button
                            type="button"
                            className={`lv2${open ? " on" : ""}`}
                            onClick={() => { setBrowse(`sector:${s.id}`); setSearch(""); }}
                          >
                            {s.title}
                          </button>
                          {editing && (
                            <span className="statements-row-acts">
                              <button
                                type="button"
                                className="statements-mini"
                                onClick={() => { setRenameId(s.id); setRenameVal(s.title); }}
                              >
                                이름
                              </button>
                              <button
                                type="button"
                                className="statements-mini"
                                onClick={() => removeSector(s.id, s.builtin)}
                              >
                                {s.builtin ? "숨김" : "삭제"}
                              </button>
                            </span>
                          )}
                        </div>
                      )}
                      {open && s.symbols.map((sym) => (
                        <div key={sym} className={`statements-item lv3-row${qKey && instrumentQueryKey(sym) === qKey ? " on" : ""}`}>
                          <button
                            type="button"
                            className={`lv3${qKey && instrumentQueryKey(sym) === qKey ? " on" : ""}`}
                            onClick={() => selectSymbol(sym)}
                          >
                            {companyLabel(sym)}
                          </button>
                          {editing && (
                            <button
                              type="button"
                              className="statements-mini"
                              onClick={() => commitPrefs(toggleSectorSymbol(prefs, s, sym, builtinDefaults))}
                            >
                              빼기
                            </button>
                          )}
                        </div>
                      ))}
                      {open && editing && collectedInRegion
                        .filter((i) => !s.symbols.some((sym) => instrumentQueryKey(sym) === instrumentQueryKey(i.symbol)))
                        .map((i) => (
                          <button
                            key={`add-${i.id}`}
                            type="button"
                            className="lv3 statements-put"
                            onClick={() => commitPrefs(toggleSectorSymbol(prefs, s, i.symbol, builtinDefaults))}
                          >
                            {i.name}
                            <span className="statements-mini">넣기</span>
                          </button>
                        ))}
                    </div>
                  );
                })}
                {editing && prefs.hiddenIds.map((id) => {
                  const g = groups.find((x) => x.id === id);
                  if (!g) return null;
                  return (
                    <button
                      key={`hid-${id}`}
                      type="button"
                      className="lv2 statements-put"
                      onClick={() => commitPrefs({
                        ...prefs,
                        hiddenIds: prefs.hiddenIds.filter((x) => x !== id),
                      })}
                    >
                      {g.title}
                      <span className="statements-mini">되돌리기</span>
                    </button>
                  );
                })}
                <form className="statements-add lv2" onSubmit={(e) => { e.preventDefault(); addCategory(); }}>
                  <input
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="섹터 이름 추가"
                    aria-label="섹터 추가"
                    maxLength={20}
                  />
                  <button type="submit">+</button>
                </form>
              </Folder>

              <Folder
                label="공시"
                open={folder === "filing"}
                onToggle={() => setFolder(folder === "filing" ? "view" : "filing")}
              >
                {filingLinks.map((s) => (
                  <a key={s.id} className="lv2" href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
                ))}
              </Folder>
            </div>
          </nav>

          <div className="erp-work">
            <MarketWork
              region={region}
              groupTitle={browseTitle}
              items={workItems}
              regionTotal={
                browse === "holdings" ? holdingRows.length
                  : browse === "watchlist" ? watchRows.length
                    : browse === "mcap" ? mcapRows.length
                      : collectedInRegion.length
              }
              filterActive={Boolean(searchTrim) && browse === "companies"}
              preferId={exact && workItems.some((i) => i.id === exact.id) ? exact.id : undefined}
              showMcap={browse === "mcap"}
              emptyHint={
                browse === "holdings"
                  ? "이 지역 보유 종목이 없습니다. 관심목록이나 기업 보기에서 고르면 됩니다."
                  : browse === "watchlist"
                    ? "이 지역 관심종목이 없습니다. /invest 에서 넣을 수 있습니다."
                    : browse === "mcap"
                      ? fundQ.data?.status === "unavailable"
                        ? "시총 스냅샷을 읽을 수 없습니다. DB를 확인하세요."
                        : "이 지역 Yahoo 시총 수집분이 없습니다. worker yahoo 수집 후 다시 보세요. 숫자는 지어내지 않습니다."
                      : activeSector
                        ? `「${activeSector.title}」에 수집된 종목이 없습니다. 왼쪽 섹터 「편집」에서 넣을 수 있습니다.`
                        : region.emptyHint
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MarketWork({
  region,
  groupTitle,
  items,
  regionTotal,
  filterActive,
  preferId,
  emptyHint,
  showMcap,
}: {
  region: StatementRegion;
  groupTitle?: string;
  items: ListItem[];
  regionTotal: number;
  filterActive: boolean;
  preferId?: string;
  emptyHint?: string;
  showMcap?: boolean;
}) {
  const [instrumentId, setInstrumentId] = useState("");
  const [year, setYear] = useState<number | undefined>(undefined);
  const explain = trpc.statements.explain.useMutation();

  useEffect(() => {
    setYear(undefined);
    explain.reset();
    if (preferId && items.some((i) => i.id === preferId)) {
      setInstrumentId(preferId);
      return;
    }
    setInstrumentId((cur) => (items.some((i) => i.id === cur) ? cur : (items[0]?.id ?? "")));
  }, [preferId, items]);

  const picked = items.find((i) => i.id === instrumentId);
  const bundle = trpc.statements.get.useQuery(
    { instrumentId, year },
    { enabled: Boolean(instrumentId) },
  );
  const data = bundle.data;
  const currency = data?.currency ?? region.currencyDefault;

  const emptyMsg = emptyHint
    ?? (!regionTotal
      ? region.emptyHint
      : filterActive
        ? "이 지역에서 검색에 맞는 수집 종목이 없습니다."
        : region.emptyHint);

  return (
    <div className="statements-erp-main">
    <div className="erp-panel">
      <h3>{showMcap ? "시가총액" : "수집 종목"} · {region.title}{groupTitle ? ` · ${groupTitle}` : ""}</h3>
      <p className="erp-hint">
        {showMcap
          ? "Yahoo 수집 시총만 큰 순. 국내·해외를 섞지 않습니다. 미수집 종목은 순위에 없습니다."
          : region.lookupHint}
      </p>

      {!items.length ? (
        <p className="erp-hint">{emptyMsg}</p>
      ) : (
        <table className="erp-grid" style={{ marginBottom: 12 }}>
          <thead>
            <tr>
              {showMcap && <th>순위</th>}
              <th>종목</th>
              <th>심볼</th>
              {showMcap && <th>시총</th>}
              <th>연도</th>
              <th>출처</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr
                key={i.id}
                className={instrumentId === i.id ? "sel on" : ""}
                onClick={() => { setInstrumentId(i.id); setYear(undefined); explain.reset(); }}
                style={{ cursor: "pointer" }}
              >
                {showMcap && <td className="ro num">{i.mcapRank ?? "—"}</td>}
                <td className="ro">{i.name}</td>
                <td className="ro">{i.symbol}</td>
                {showMcap && (
                  <td className="ro num">
                    {i.marketCap != null ? formatMcapLabel(i.marketCap, i.currency ?? region.currencyDefault) : "—"}
                  </td>
                )}
                <td className="ro">{i.years.slice(0, 4).join(", ") || "—"}</td>
                <td className="ro">{i.sources.join(", ") || (showMcap ? "yahoo" : "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {picked && data?.years?.length ? (
        <div className="erp-slip" style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {data.years.map((y) => (
            <button
              key={y}
              type="button"
              className={data.fiscalYear === y ? "primary" : undefined}
              onClick={() => { setYear(y); explain.reset(); }}
            >
              {y}
            </button>
          ))}
          <button
            type="button"
            className="primary"
            disabled={!instrumentId || explain.isPending}
            onClick={() => explain.mutate({ instrumentId, year: data.fiscalYear ?? undefined })}
          >
            {explain.isPending ? "읽는 중…" : "읽어주기"}
          </button>
        </div>
      ) : null}

      {bundle.isLoading && instrumentId && <p className="erp-hint">숫자 불러오는 중…</p>}
      {bundle.error && <p className="erp-caution">오류: {bundle.error.message}</p>}

      {picked && data?.fiscalYear && (
        <>
          <div className="statements-erp-grids">
            <StmtGrid kind="income" items={data.income} currency={currency} />
            <StmtGrid kind="balance" items={data.balance} currency={currency} />
            <StmtGrid kind="cashflow" items={data.cashflow} currency={currency} />
          </div>
        </>
      )}

      {explain.error && <p className="erp-caution">오류: {explain.error.message}</p>}
      {explain.data && (
        <>
          <h3>읽어주기 · {explain.data.provider} · {explain.data.fiscalYear}</h3>
          <div className="md erp-memo" style={{ minHeight: 120 }}><ReactMarkdown>{explain.data.reading}</ReactMarkdown></div>
        </>
      )}
    </div>
    <StatementSide
      region={region}
      picked={picked}
      data={picked && data?.fiscalYear ? data : undefined}
      currency={currency}
    />
    </div>
  );
}

function SideCard({
  title,
  extra,
  reserved,
  children,
}: {
  title: string;
  extra?: string;
  reserved?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`statements-side-card${reserved ? " reserved" : ""}`}>
      <h3>
        {title}
        {extra ? <span className="statements-side-year">{extra}</span> : null}
        {reserved ? <span className="statements-cat-empty">추가</span> : null}
      </h3>
      <div className="body">{children}</div>
    </section>
  );
}

function StatementSide({
  region,
  picked,
  data,
  currency,
}: {
  region: StatementRegion;
  picked?: ListItem;
  data?: {
    fiscalYear: number;
    ratios: {
      opMargin?: number | null;
      netMargin?: number | null;
      debtToAssets?: number | null;
      roe?: number | null;
      cfoMinusNetIncome?: number | null;
    };
    audit: {
      opinion?: string | null;
      auditor?: string | null;
      goingConcern?: boolean;
      auditorSite?: { label: string; url: string } | null;
      dartUrl?: string | null;
    } | null;
    overview?: {
      corpName?: string | null;
      ceo?: string | null;
      corpClass?: string | null;
      industryCode?: string | null;
      industryName?: string | null;
      establishedOn?: string | null;
      fiscalMonth?: string | null;
      address?: string | null;
      homepage?: string | null;
      phone?: string | null;
      source?: string;
    } | null;
    holders?: Array<{
      name: string;
      relation?: string | null;
      stockKind?: string | null;
      shares?: number | null;
      ratio?: number | null;
    }> | null;
    dividends?: Array<{
      label: string;
      stockKind?: string | null;
      current?: string | null;
      prior?: string | null;
      prior2?: string | null;
    }> | null;
    segments?: Array<{ name: string; amount?: number | null }> | null;
  };
  currency: string;
}) {
  const ratioRows: Array<[string, string]> = [];
  if (data?.ratios.opMargin != null) ratioRows.push(["영업이익률", pct(data.ratios.opMargin)]);
  if (data?.ratios.netMargin != null) ratioRows.push(["순이익률", pct(data.ratios.netMargin)]);
  if (data?.ratios.debtToAssets != null) ratioRows.push(["부채/자산", pct(data.ratios.debtToAssets)]);
  if (data?.ratios.roe != null) ratioRows.push(["ROE", pct(data.ratios.roe)]);
  if (data?.ratios.cfoMinusNetIncome != null) {
    ratioRows.push(["영업CF−순이익", won(data.ratios.cfoMinusNetIncome, currency)]);
  }

  return (
    <aside className="statements-erp-side" aria-label="기업정보">
      {STATEMENT_SIDE_SLOTS.map((slot) => {
        if (slot.id === "summary") {
          return (
            <SideCard key={slot.id} title={slot.title}>
              {picked ? (
                <table className="erp-props">
                  <tbody>
                    <tr><th>이름</th><td className="ro">{picked.name}</td></tr>
                    <tr><th>심볼</th><td className="ro">{picked.symbol}</td></tr>
                    <tr><th>시장</th><td className="ro">{picked.market}</td></tr>
                    {data?.fiscalYear != null && (
                      <tr><th>연도</th><td className="ro">{data.fiscalYear}</td></tr>
                    )}
                    {!!picked.sources.length && (
                      <tr><th>출처</th><td className="ro">{picked.sources.join(", ")}</td></tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <p className="erp-hint">{slot.emptyHint}</p>
              )}
            </SideCard>
          );
        }
        if (slot.id === "ratios") {
          return (
            <SideCard key={slot.id} title={slot.title} extra="수집분">
              {ratioRows.length ? (
                <table className="erp-props">
                  <tbody>
                    {ratioRows.map(([k, v]) => (
                      <tr key={k}><th>{k}</th><td className="ro">{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="erp-hint">{slot.emptyHint}</p>
              )}
            </SideCard>
          );
        }
        if (slot.id === "audit") {
          const audit = data?.audit;
          return (
            <SideCard key={slot.id} title={slot.title} extra={data ? String(data.fiscalYear) : undefined}>
              {audit ? (
                <>
                  <table className="erp-props">
                    <tbody>
                      <tr><th>의견</th><td className="ro">{audit.opinion ?? "—"}</td></tr>
                      {audit.auditor && (
                        <tr><th>감사인</th><td className="ro">{audit.auditor}</td></tr>
                      )}
                    </tbody>
                  </table>
                  {audit.goingConcern && (
                    <p className="erp-hint">계속기업 관련 문구가 공시에 있습니다. 적정이어도 건전성 보장이 아닙니다.</p>
                  )}
                  <div className="erp-slip">
                    {audit.auditorSite && (
                      <a href={audit.auditorSite.url} target="_blank" rel="noreferrer">
                        {audit.auditor ?? audit.auditorSite.label} 홈
                      </a>
                    )}
                    {audit.dartUrl && (
                      <a href={audit.dartUrl} target="_blank" rel="noreferrer">DART 공시</a>
                    )}
                    {region.venue === "dart" && picked && filingVenueFor(picked.symbol) === "dart" && (
                      <a href="https://dart.fss.or.kr/dsab007/main.do" target="_blank" rel="noreferrer">
                        감사검색
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p className="erp-hint">{picked ? region.auditEmptyHint : slot.emptyHint}</p>
              )}
            </SideCard>
          );
        }
        if (slot.id === "overview") {
          const o = data?.overview;
          const rows: Array<[string, string]> = [];
          if (o?.corpName) rows.push(["법인", o.corpName]);
          if (o?.ceo) rows.push(["대표", o.ceo]);
          if (o?.corpClass) rows.push(["구분", o.corpClass]);
          if (o?.industryName) rows.push(["업종", o.industryName]);
          else if (o?.industryCode) rows.push(["업종코드", o.industryCode]);
          if (o?.establishedOn) rows.push(["설립", o.establishedOn]);
          if (o?.fiscalMonth) rows.push(["결산월", o.fiscalMonth]);
          if (o?.address) rows.push(["주소", o.address]);
          if (o?.phone) rows.push(["전화", o.phone]);
          return (
            <SideCard key={slot.id} title={slot.title} extra={o?.source}>
              {rows.length ? (
                <>
                  <table className="erp-props">
                    <tbody>
                      {rows.map(([k, v]) => (
                        <tr key={k}><th>{k}</th><td className="ro">{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  {o?.homepage && (
                    <div className="erp-slip">
                      <a href={o.homepage.startsWith("http") ? o.homepage : `https://${o.homepage}`} target="_blank" rel="noreferrer">홈페이지</a>
                    </div>
                  )}
                </>
              ) : (
                <p className="erp-hint">{slot.emptyHint}</p>
              )}
            </SideCard>
          );
        }
        if (slot.id === "segment") {
          const rows = data?.segments ?? [];
          return (
            <SideCard key={slot.id} title={slot.title} extra={data ? String(data.fiscalYear) : undefined}>
              {rows.length ? (
                <table className="erp-props">
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.name}>
                        <th>{r.name}</th>
                        <td className="ro">{r.amount != null ? won(r.amount, currency) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="erp-hint">{slot.emptyHint}</p>
              )}
            </SideCard>
          );
        }
        if (slot.id === "holders") {
          const rows = data?.holders ?? [];
          return (
            <SideCard key={slot.id} title={slot.title} extra={data ? String(data.fiscalYear) : undefined}>
              {rows.length ? (
                <table className="erp-props">
                  <tbody>
                    {rows.slice(0, 8).map((r) => (
                      <tr key={`${r.name}-${r.relation ?? ""}`}>
                        <th>{r.name}{r.relation ? ` · ${r.relation}` : ""}</th>
                        <td className="ro">
                          {r.ratio != null ? `${r.ratio}%` : "—"}
                          {r.shares != null ? ` · ${r.shares.toLocaleString("ko-KR")}주` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="erp-hint">{slot.emptyHint}</p>
              )}
            </SideCard>
          );
        }
        if (slot.id === "dividend") {
          const rows = data?.dividends ?? [];
          return (
            <SideCard key={slot.id} title={slot.title} extra={data ? String(data.fiscalYear) : undefined}>
              {rows.length ? (
                <table className="erp-props">
                  <tbody>
                    {rows.slice(0, 12).map((r) => (
                      <tr key={`${r.label}-${r.stockKind ?? ""}`}>
                        <th>{r.label}{r.stockKind ? ` (${r.stockKind})` : ""}</th>
                        <td className="ro">{r.current ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="erp-hint">{slot.emptyHint}</p>
              )}
            </SideCard>
          );
        }
        return (
          <SideCard key={slot.id} title={slot.title} reserved={slot.kind === "reserved"}>
            <p className="erp-hint">{slot.emptyHint}</p>
          </SideCard>
        );
      })}
    </aside>
  );
}

function StmtGrid({ kind, items, currency }: {
  kind: keyof typeof FS_STATEMENT_LABELS;
  items: Record<string, number>;
  currency: string;
}) {
  const rows = Object.entries(items);
  return (
    <div className="wehago-widget">
      <h3>{FS_STATEMENT_LABELS[kind]}</h3>
      <div className="body">
        {rows.length ? (
          <table className="erp-grid">
            <tbody>
              {rows.map(([k, n]) => (
                <tr key={k}>
                  <td className="ro">{FS_ITEM_LABELS[k] ?? k}</td>
                  <td className="ro num">{won(n, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="erp-hint">없음</p>
        )}
      </div>
    </div>
  );
}
