"use client";
import {
  REALTY_MAP_POINTS,
  REALTY_MAP_VIEW,
  REALTY_METROS,
  REALTY_MOVE_2025,
  planExtrudeMeters,
  realtyMetroForPlace,
  realtyPlanFromKostat,
  type RealtyMetroId,
  type RealtyPlanStyle,
} from "@finvesting/core";
import { useEffect, useRef, type ReactNode } from "react";
import type { DataDrivenPropertyValueSpecification, GeoJSONSource, LngLatLike, Map as MlMap, MapLayerMouseEvent, Marker, Popup } from "maplibre-gl";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import plan from "./korea-plan.json";
import { RealtyMoveDetail } from "./move-detail";
import { RealtyTenureDetail } from "./tenure-detail";

const FILL: Record<string, string> = {
  danger: "#dc2626",
  warn: "#ea580c",
  info: "#2563eb",
  growth: "#64748b",
  nature: "#0f766e",
  muted: "#9aa3ad",
};

function fillOf(s: RealtyPlanStyle) {
  if (s.kind === "growth") return FILL.growth!;
  if (s.kind === "nature") return FILL.nature!;
  if (s.tone === "danger") return FILL.danger!;
  if (s.tone === "warn") return FILL.warn!;
  if (s.tone === "info") return FILL.info!;
  return FILL.muted!;
}

function kindLabel(s: RealtyPlanStyle) {
  if (s.kind === "regulated") return s.fresh ? "규제 · 대출규제 · 7/1" : "규제 · 대출규제";
  if (s.kind === "overcrowded") return "과밀억제";
  if (s.kind === "growth") return s.hatch ? "성장관리 · 동탄만 규제" : "성장관리";
  if (s.kind === "nature") return "자연보전";
  if (s.kind === "out") return "권역 제외";
  return "목록 외";
}

function darkBg() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function walkCoords(geom: Geometry, fn: (lng: number, lat: number) => void) {
  const walk = (c: Position | Position[] | Position[][] | Position[][][]) => {
    if (typeof c[0] === "number") {
      const p = c as Position;
      fn(p[0]!, p[1]!);
      return;
    }
    for (const x of c as Array<Position | Position[] | Position[][]>) walk(x);
  };
  if (geom.type === "GeometryCollection") {
    for (const g of geom.geometries) walkCoords(g, fn);
    return;
  }
  walk(geom.coordinates as Position[][][]);
}

function spanArea(geom: Geometry): number {
  const b = boundsOf([{ type: "Feature", properties: {}, geometry: geom }]);
  if (!b) return 0;
  return Math.abs(b[1][0] - b[0][0]) * Math.abs(b[1][1] - b[0][1]);
}

function boundsOf(feats: Feature[]): [[number, number], [number, number]] | null {
  let minX = 180, minY = 90, maxX = -180, maxY = -90, n = 0;
  for (const f of feats) {
    if (!f.geometry) continue;
    walkCoords(f.geometry, (lng, lat) => {
      minX = Math.min(minX, lng); minY = Math.min(minY, lat);
      maxX = Math.max(maxX, lng); maxY = Math.max(maxY, lat);
      n++;
    });
  }
  if (!n) return null;
  return [[minX, minY], [maxX, maxY]];
}

function labelLngLat(geom: Geometry): [number, number] | null {
  const b = boundsOf([{ type: "Feature", properties: {}, geometry: geom }]);
  if (!b) return null;
  return [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2];
}

type PlanProps = {
  code: string;
  placeId: string;
  metro: RealtyMetroId;
  label: string;
  short: string;
  kindLabel: string;
  note: string;
};

function buildFc(heights: Record<RealtyMetroId, number> | null): FeatureCollection {
  const src = plan as FeatureCollection;
  const features = src.features.map((feat) => {
    const p = feat.properties as { code: string; name: string };
    const s = realtyPlanFromKostat(p.code, p.name);
    const metro = s.metro ?? realtyMetroForPlace(s.id);
    return {
      type: "Feature" as const,
      properties: {
        code: p.code,
        name: p.name,
        placeId: s.id,
        metro,
        label: s.label,
        short: s.short,
        kind: s.kind,
        note: s.note,
        kindLabel: kindLabel(s),
        color: fillOf(s),
        hatch: s.hatch ? 1 : 0,
        height: planExtrudeMeters(s.kind, heights?.[metro] ?? null),
      },
      geometry: feat.geometry,
    };
  });
  return { type: "FeatureCollection", features };
}

function metroCentroids(fc: FeatureCollection): { id: RealtyMetroId; label: string; lng: number; lat: number }[] {
  const acc = new Map<RealtyMetroId, { x: number; y: number; n: number }>();
  for (const f of fc.features) {
    const metro = (f.properties as { metro?: RealtyMetroId } | null)?.metro;
    if (!metro || !f.geometry) continue;
    const xy = labelLngLat(f.geometry);
    if (!xy) continue;
    const cur = acc.get(metro) ?? { x: 0, y: 0, n: 0 };
    acc.set(metro, { x: cur.x + xy[0], y: cur.y + xy[1], n: cur.n + 1 });
  }
  return REALTY_METROS.flatMap((m) => {
    const c = acc.get(m.id);
    if (!c || !c.n) return [];
    return [{ id: m.id, label: m.label, lng: c.x / c.n, lat: c.y / c.n }];
  });
}

function focusLngLat(fc: FeatureCollection, id: string, code: string | null): [number, number] | null {
  if (id === "dongtan") {
    const d = REALTY_MAP_POINTS.find((x) => x.id === "dongtan");
    if (d) return [d.lng, d.lat];
  }
  const feats = fc.features.filter((f) => {
    const p = f.properties as { placeId?: string; metro?: string; code?: string } | null;
    if (!p) return false;
    if (code && code !== id) return p.code === code;
    return p.placeId === id || p.metro === id;
  });
  const b = boundsOf(feats);
  if (!b) return null;
  return [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2];
}

function along(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function bearingDeg(a: [number, number], b: [number, number]) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
  const x = Math.cos(rad(a[1])) * Math.sin(rad(b[1])) - Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

type MoveArrow = {
  from: [number, number];
  to: [number, number];
  color: string;
  kind: "out" | "in";
  label: string;
  bearing: number;
  mid: [number, number];
  width: number;
  far?: boolean;
  local?: boolean;
};

function slideLine(a: [number, number], b: [number, number], gap: number, sign: number, t0: number, t1: number) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const ox = (-dy / len) * gap * sign;
  const oy = (dx / len) * gap * sign;
  const shift = (p: [number, number]): [number, number] => [p[0] + ox, p[1] + oy];
  return { from: shift(along(a, b, t0)), to: shift(along(a, b, t1)) };
}

function arrowOf(
  from: [number, number],
  to: [number, number],
  color: string,
  kind: "out" | "in",
  label: string,
  width: number,
  labelAt: [number, number],
  far?: boolean,
  local?: boolean,
): MoveArrow {
  return { from, to, color, kind, label, bearing: bearingDeg(from, to), mid: labelAt, width, far, local };
}

function populationMoves(fc: FeatureCollection): MoveArrow[] {
  const metros = metroCentroids(fc);
  const at = (id: string) => {
    const m = metros.find((x) => x.id === id);
    return m ? [m.lng, m.lat] as [number, number] : null;
  };
  const move = REALTY_MOVE_2025;
  const maxPct = Math.max(...move.capitalPairs.flatMap((p) => [p.outPct, p.inPct]));
  const arrows: MoveArrow[] = [];
  for (const pair of move.capitalPairs) {
    const a = at(pair.from);
    const b = at(pair.to);
    if (!a || !b) continue;
    const out = slideLine(a, b, 0.16, 1, 0.22, 0.78);
    const inn = slideLine(b, a, 0.16, -1, 0.22, 0.78);
    arrows.push(
      arrowOf(out.from, out.to, "#2563eb", "out", `${pair.outLabel} ${pair.outPct.toFixed(1)}%`, 1.3 + (pair.outPct / maxPct) * 2.2, along(out.from, out.to, 0.5)),
      arrowOf(inn.from, inn.to, "#dc2626", "in", `${pair.inLabel} ${pair.inPct.toFixed(1)}%`, 1.3 + (pair.inPct / maxPct) * 2.2, along(inn.from, inn.to, 0.5)),
    );
  }
  const capPts = ["seoul", "incheon", "gyeonggi"].map(at).filter((p): p is [number, number] => !!p);
  if (!capPts.length) return arrows;
  const cap: [number, number] = [
    capPts.reduce((s, p) => s + p[0], 0) / capPts.length,
    capPts.reduce((s, p) => s + p[1], 0) / capPts.length,
  ];
  const maxThou = Math.max(...move.provinceCapital.flatMap((r) => [r.toCapital, r.fromCapital]));
  for (const row of move.provinceCapital) {
    const a = at(row.id);
    const name = REALTY_METROS.find((m) => m.id === row.id)?.label ?? row.id;
    if (!a) continue;
    const go = slideLine(a, cap, 0.08, 1, 0.2, 0.58);
    const back = slideLine(cap, a, 0.08, -1, 0.42, 0.8);
    const labelAt = row.id === "jeju" ? along(a, cap, 0.22) : along(cap, a, 1.15);
    arrows.push(
      arrowOf(go.from, go.to, "#dc2626", "in", "", 1.15 + (row.toCapital / maxThou) * 2.6, labelAt, true),
      arrowOf(back.from, back.to, "#2563eb", "out", `${name} →${row.toCapital} ←${row.fromCapital}`, 1.15 + (row.fromCapital / maxThou) * 2.6, labelAt, true),
    );
  }
  const localPcts = [
    ...move.localPairs.flatMap((p) => [p.outPct, p.inPct]),
    ...move.localOne.map((p) => p.pct),
  ];
  const maxLocal = Math.max(...localPcts);
  move.localPairs.forEach((pair, i) => {
    const a = at(pair.from);
    const b = at(pair.to);
    if (!a || !b) return;
    const sign = i % 2 === 0 ? 1 : -1;
    const out = slideLine(a, b, 0.12, sign, 0.28, 0.72);
    const inn = slideLine(b, a, 0.12, sign, 0.28, 0.72);
    arrows.push(
      arrowOf(out.from, out.to, "#c2410c", "out", `${pair.outLabel} ${pair.outPct.toFixed(1)}%`, 1.15 + (pair.outPct / maxLocal) * 1.8, along(out.from, out.to, 0.35), true, true),
      arrowOf(inn.from, inn.to, "#0f766e", "in", `${pair.inLabel} ${pair.inPct.toFixed(1)}%`, 1.15 + (pair.inPct / maxLocal) * 1.8, along(inn.from, inn.to, 0.65), true, true),
    );
  });
  for (const one of move.localOne) {
    const a = at(one.from);
    const b = at(one.to);
    if (!a || !b) continue;
    const line = slideLine(a, b, 0.14, 1, 0.3, 0.72);
    const color = one.kind === "in" ? "#0f766e" : "#c2410c";
    arrows.push(arrowOf(line.from, line.to, color, one.kind === "in" ? "in" : "out", `${one.label} ${one.pct.toFixed(1)}%`, 1.15 + (one.pct / maxLocal) * 1.8, along(line.from, line.to, 0.5), true, true));
  }
  return arrows;
}

function withinNetLngLat(fc: FeatureCollection, id: string): [number, number] | null {
  const m = metroCentroids(fc).find((x) => x.id === id);
  if (!m) return null;
  const shift: Record<string, [number, number]> = {
    seoul: [0.22, 0.48],
    incheon: [-0.42, 0.28],
    gyeonggi: [0.4, -0.15],
  };
  const d = shift[id] ?? [0, 0.3];
  return [m.lng + d[0], m.lat + d[1]];
}

function focusMatch(focusId: string | null, focusCode: string | null) {
  if (!focusId) return null;
  if (focusCode && focusCode !== focusId) return ["==", ["get", "code"], focusCode] as const;
  return ["any", ["==", ["get", "placeId"], focusId], ["==", ["get", "metro"], focusId]] as const;
}

function highlightPaint(focusId: string | null, focusCode: string | null): DataDrivenPropertyValueSpecification<string> {
  const match = focusMatch(focusId, focusCode);
  if (!match) return ["get", "color"];
  return ["case", match, "#f59e0b", ["get", "color"]] as unknown as DataDrivenPropertyValueSpecification<string>;
}

function heightPaint(focusId: string | null, focusCode: string | null): DataDrivenPropertyValueSpecification<number> {
  const own = ["to-number", ["get", "height"]] as DataDrivenPropertyValueSpecification<number>;
  const match = focusMatch(focusId, focusCode);
  if (!match) return own;
  return ["case", match, ["+", own, 5200], 180] as unknown as DataDrivenPropertyValueSpecification<number>;
}

export function RealtyGeoMap({
  focusId,
  focusCode,
  heights,
  onFocus,
  children,
}: {
  focusId: string | null;
  focusCode: string | null;
  heights: Record<RealtyMetroId, number> | null;
  onFocus: (id: string, label: string, code?: string) => void;
  children?: ReactNode;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const moveMarkers = useRef<Marker[]>([]);
  const skyRef = useRef<HTMLDivElement>(null);
  const skyMarker = useRef<Marker | null>(null);
  const mlRef = useRef<typeof import("maplibre-gl") | null>(null);
  const fcRef = useRef<FeatureCollection>(buildFc(heights));
  const fit = useRef<((id: string, code?: string | null) => void) | null>(null);
  const onFocusRef = useRef(onFocus);
  const heightsRef = useRef(heights);
  const focusRef = useRef(focusId);
  const codeRef = useRef(focusCode);
  onFocusRef.current = onFocus;
  heightsRef.current = heights;
  focusRef.current = focusId;
  codeRef.current = focusCode;

  useEffect(() => {
    let dead = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      mlRef.current = maplibregl;
      if (dead || !el.current || mapRef.current) return;
      maplibregl.setWorkerUrl(`${window.location.origin}/maplibre-gl-worker.mjs`);
      const bg = darkBg() ? "#1c1a16" : "#efe9dc";
      const line = darkBg() ? "#f4efe4" : "#2c2924";
      const map = new maplibregl.Map({
        container: el.current,
        style: {
          version: 8,
          sources: {},
          layers: [{ id: "bg", type: "background", paint: { "background-color": bg } }],
        },
        center: [REALTY_MAP_VIEW.lng, REALTY_MAP_VIEW.lat],
        zoom: REALTY_MAP_VIEW.zoom,
        pitch: 32,
        bearing: -12,
        maxPitch: 70,
        attributionControl: false,
      });
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: "통계청 2018 전국 시군구 · 단순화. 동탄구 면 없음. 높이=시도 대출 말잔 비율(시·구 아님)" }));

      const tip = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: "plan-tip-pop" });
      const pop = new maplibregl.Popup({ closeButton: true, offset: 16, className: "plan-pop" });
      popupRef.current = pop;

      const openPop = (lngLat: LngLatLike, label: string, kind: string, note: string) => {
        pop.setLngLat(lngLat).setHTML(
          `<strong>${label}</strong><div style="font-size:12px;opacity:.75;margin-top:2px">${kind}</div><p style="margin:6px 0 0">${note}</p>`,
        ).addTo(map);
      };

      const paintSel = () => {
        const expr = highlightPaint(focusRef.current, codeRef.current);
        const lift = heightPaint(focusRef.current, codeRef.current);
        if (map.getLayer("blocks")) {
          map.setPaintProperty("blocks", "fill-extrusion-color", expr);
          map.setPaintProperty("blocks", "fill-extrusion-height", lift);
        }
        if (map.getLayer("flat")) map.setPaintProperty("flat", "fill-color", expr);
        for (const mk of markersRef.current) {
          const node = mk.getElement();
          const code = node.dataset.code ?? "";
          const id = node.dataset.placeId ?? "";
          const metro = node.dataset.metro ?? "";
          const picked = focusRef.current;
          const on = codeRef.current && codeRef.current !== picked
            ? code === codeRef.current
            : Boolean(picked && (id === picked || metro === picked));
          node.classList.toggle("on", on);
        }
      };

      let labelGen = 0;
      let placing = false;
      const placeLabels = () => {
        if (placing) return;
        placing = true;
        const gen = ++labelGen;
        try {
        for (const mk of markersRef.current) mk.remove();
        markersRef.current = [];
        const z = map.getZoom();
        const district = z >= 6.7;
        const fontPx = district ? (z < 8.2 ? 11 : 12) : 12;
        type Box = { l: number; t: number; r: number; b: number };
        const taken: Box[] = [];
        const root = map.getContainer();
        const rootBox = root.getBoundingClientRect();
        const hits = (box: Box, boxes: Box[]) => boxes.some((b) => box.l < b.r && box.r > b.l && box.t < b.b && box.b > b.t);
        const add = (lng: number, lat: number, p: PlanProps, force: boolean, city = false, pin = false) => {
          let pt: { x: number; y: number };
          try {
            pt = map.project([lng, lat]);
          } catch {
            return;
          }
          if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return;
          const w = p.short.length * 16 + 14;
          const h = 22;
          const shifts: [number, number][] = district && !city && !pin
            ? [[0, 0]]
            : [[0, 0], [0, -32], [0, 32], [-48, 0], [48, 0], [-32, -28], [32, -28], [-32, 28], [32, 28], [0, -56], [0, 56]];
          let chosen: [number, number] | null = null;
          let chosenBox: Box | null = null;
          for (const shift of shifts) {
            const [dx, dy] = shift;
            const box = { l: pt.x + dx - w / 2, t: pt.y + dy - h / 2, r: pt.x + dx + w / 2, b: pt.y + dy + h / 2 };
            const outside = box.l < 4 || box.t < 4 || box.r > rootBox.width - 4 || box.b > rootBox.height - 4;
            if (!force && (hits(box, taken) || outside)) continue;
            chosen = shift;
            chosenBox = box;
            break;
          }
          if (!chosen && pin) {
            chosen = [0, -40];
            chosenBox = { l: pt.x - w / 2, t: pt.y - 40 - h / 2, r: pt.x + w / 2, b: pt.y - 40 + h / 2 };
          }
          if (gen !== labelGen || !chosen || !chosenBox) return;
          taken.push(chosenBox);
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = city ? "plan-label city" : "plan-label";
          btn.textContent = p.short;
          btn.style.fontSize = `${city ? 13 : fontPx}px`;
          btn.dataset.code = p.code;
          btn.dataset.placeId = p.placeId;
          btn.dataset.metro = p.metro;
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const code = p.code !== p.metro ? p.code : undefined;
            onFocusRef.current(p.placeId, p.label, code);
            openPop([lng, lat], p.label, p.kindLabel, p.note);
          });
          const mk = new maplibregl.Marker({ element: btn, anchor: "center", offset: chosen }).setLngLat([lng, lat]).addTo(map);
          markersRef.current.push(mk);
        };
        const cityMetros = new Set<RealtyMetroId>(["seoul", "busan", "daegu", "incheon", "gwangju", "daejeon", "ulsan"]);
        const siHeads = ["수원시", "성남시", "안양시", "안산시", "고양시", "용인시"];
        const ringSi = new Set(["의정부시", "부천시", "광명시", "과천시", "구리시", "남양주시", "시흥시", "군포시", "의왕시", "하남시", "파주시", "김포시", "화성시", "광주시", "양주시", "오산시", "동두천시"]);
        type Item = { lng: number; lat: number; p: PlanProps; area: number; city?: boolean; pin?: boolean };
        const items: Item[] = [];
        const isFocus = (p: PlanProps) =>
          codeRef.current ? p.code === codeRef.current : Boolean(focusRef.current && p.placeId === focusRef.current);
        if (z < 6.7) {
          for (const c of metroCentroids(fcRef.current)) {
            const city = cityMetros.has(c.id);
            items.push({
              lng: c.lng,
              lat: c.lat,
              area: 1,
              city,
              p: {
                code: c.id,
                placeId: c.id,
                metro: c.id,
                label: c.label,
                short: c.label,
                kindLabel: city ? "광역시" : "광역시도",
                note: city
                  ? "예금은행 가계대출은 이 광역시 말잔입니다. 구 숫자는 없습니다."
                  : "예금은행 가계대출은 이 시도 말잔입니다. 시·구 숫자는 없습니다.",
              },
            });
          }
        } else {
          const view = map.getBounds();
          const groupSi = z < 10;
          const groups = new Map<string, { lng: number; lat: number; n: number; area: number; p: PlanProps }>();
          for (const f of fcRef.current.features) {
            if (!f.geometry) continue;
            const xy = labelLngLat(f.geometry);
            const p = f.properties as (PlanProps & { name?: string }) | null;
            if (!xy || !p?.short) continue;
            if (!view.contains([xy[0], xy[1]])) continue;
            const full = p.name ?? "";
            const head = groupSi ? siHeads.find((h) => full.startsWith(h)) : undefined;
            if (head) {
              const area = spanArea(f.geometry);
              const prev = groups.get(head);
              const named: PlanProps = {
                ...p,
                short: head.replace(/시$/, ""),
                label: head,
                kindLabel: "시",
                note: "이 시의 구는 더 확대하면 나뉩니다.",
              };
              if (!prev) groups.set(head, { lng: xy[0], lat: xy[1], n: 1, area, p: named });
              else {
                prev.lng += xy[0];
                prev.lat += xy[1];
                prev.n += 1;
                if (area > prev.area) {
                  prev.area = area;
                  prev.p = named;
                }
              }
              continue;
            }
            const around = focusRef.current === "gyeonggi";
            items.push({ lng: xy[0], lat: xy[1], p, area: spanArea(f.geometry), pin: around && ringSi.has(full) });
          }
          for (const g of groups.values()) {
            items.push({ lng: g.lng / g.n, lat: g.lat / g.n, p: g.p, area: g.area, pin: true });
          }
          for (const c of metroCentroids(fcRef.current)) {
            if (!cityMetros.has(c.id) || !view.contains([c.lng, c.lat])) continue;
            items.push({
              lng: c.lng,
              lat: c.lat,
              area: Number.POSITIVE_INFINITY,
              city: true,
              p: {
                code: c.id,
                placeId: c.id,
                metro: c.id,
                label: c.label,
                short: c.label,
                kindLabel: "광역시",
                note: "예금은행 가계대출은 이 광역시 말잔입니다. 구 숫자는 없습니다.",
              },
            });
          }
          const dongtan = REALTY_MAP_POINTS.find((x) => x.id === "dongtan");
          if (dongtan && view.contains([dongtan.lng, dongtan.lat])) {
            items.push({
              lng: dongtan.lng,
              lat: dongtan.lat,
              area: 0,
              p: {
                code: "dongtan",
                placeId: "dongtan",
                metro: "gyeonggi",
                label: dongtan.label,
                short: "동탄구",
                kindLabel: "규제 · 대출규제 · 7/1",
                note: dongtan.note,
              },
            });
          }
        }
        const metroRank = ["seoul", "gyeonggi", "incheon", "busan", "daegu", "daejeon", "gwangju", "ulsan", "sejong"];
        items.sort((a, b) => {
          const city = Number(Boolean(b.city) || Boolean(b.pin)) - Number(Boolean(a.city) || Boolean(a.pin));
          if (city) return city;
          const focus = Number(isFocus(b.p)) - Number(isFocus(a.p));
          if (focus) return focus;
          if (!district) {
            const ar = metroRank.indexOf(a.p.placeId);
            const br = metroRank.indexOf(b.p.placeId);
            return (ar < 0 ? 99 : ar) - (br < 0 ? 99 : br);
          }
          const around = focusRef.current === "gyeonggi";
          return around ? a.area - b.area : b.area - a.area;
        });
        for (const it of items) add(it.lng, it.lat, it.p, (district && Boolean(it.city)) || isFocus(it.p), Boolean(it.city), Boolean(it.pin));
        paintSel();
        } finally {
          placing = false;
        }
      };

      const boot = () => {
        if (dead) return;
        if (map.getSource("plan")) {
          try { placeLabels(); } catch (err) { console.error("realty map labels", err); }
          return;
        }
        try {
          fcRef.current = buildFc(heightsRef.current);
          map.addSource("plan", { type: "geojson", data: fcRef.current });
          map.addLayer({
            id: "flat",
            type: "fill",
            source: "plan",
            paint: {
              "fill-color": ["get", "color"],
              "fill-opacity": 0.78,
            },
          });
          map.addLayer({
            id: "blocks",
            type: "fill-extrusion",
            source: "plan",
            paint: {
              "fill-extrusion-color": ["get", "color"],
              "fill-extrusion-height": ["to-number", ["get", "height"]],
              "fill-extrusion-base": 0,
              "fill-extrusion-opacity": 0.88,
            },
          });
          map.addLayer({
            id: "borders",
            type: "line",
            source: "plan",
            paint: {
              "line-color": line,
              "line-width": 1.15,
              "line-opacity": 0.92,
            },
          });
          map.addLayer({
            id: "hatch-line",
            type: "line",
            source: "plan",
            filter: ["==", ["get", "hatch"], 1],
            paint: {
              "line-color": "#dc2626",
              "line-width": 1.8,
              "line-dasharray": [2, 1.2],
            },
          });

          const moves = populationMoves(fcRef.current);
          if (moves.length && !map.getSource("move")) {
            map.addSource("move", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: moves.map((m) => ({
                  type: "Feature" as const,
                  properties: { color: m.color, width: m.width },
                  geometry: { type: "LineString" as const, coordinates: [m.from, m.to] },
                })),
              },
            });
            map.addLayer({
              id: "move-line",
              type: "line",
              source: "move",
              paint: {
                "line-color": ["get", "color"],
                "line-width": ["get", "width"],
                "line-opacity": 0.9,
              },
            });
            for (const m of moves) {
              const head = document.createElement("i");
              head.className = `move-head ${m.kind}${m.local ? " local" : ""}`;
              head.style.transform = `rotate(${m.bearing}deg)`;
              moveMarkers.current.push(new maplibregl.Marker({ element: head, anchor: "center" }).setLngLat(m.to).addTo(map));
              if (!m.label) continue;
              const label = document.createElement("span");
              label.className = `move-label ${m.kind}${m.local ? " local" : ""}${m.far ? " far" : ""}`;
              label.textContent = m.label;
              moveMarkers.current.push(new maplibregl.Marker({ element: label, anchor: "center" }).setLngLat(m.mid).addTo(map));
            }
            for (const net of REALTY_MOVE_2025.withinCapital.nets) {
              const pos = withinNetLngLat(fcRef.current, net.id);
              if (!pos) continue;
              const label = document.createElement("span");
              label.className = `move-label ${net.thou < 0 ? "out" : "in"}`;
              const sign = net.thou > 0 ? "+" : "";
              label.textContent = `${REALTY_METROS.find((x) => x.id === net.id)?.label ?? net.id} 수도권내 ${sign}${net.thou}`;
              moveMarkers.current.push(new maplibregl.Marker({ element: label, anchor: "center" }).setLngLat(pos).addTo(map));
            }
          }

          const dongtan = REALTY_MAP_POINTS.find((x) => x.id === "dongtan");
          if (dongtan) {
            map.addSource("dongtan", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {
                  placeId: "dongtan",
                  code: "dongtan",
                  label: dongtan.label,
                  kindLabel: "규제 · 대출규제 · 7/1",
                  note: dongtan.note,
                },
                geometry: { type: "Point", coordinates: [dongtan.lng, dongtan.lat] },
              },
            });
            map.addLayer({
              id: "dongtan-pt",
              type: "circle",
              source: "dongtan",
              paint: {
                "circle-radius": 16,
                "circle-color": "#dc2626",
                "circle-opacity": 0.28,
                "circle-stroke-width": 2,
                "circle-stroke-color": "#dc2626",
                "circle-stroke-opacity": 1,
              },
            });
          }

          const hit = (e: MapLayerMouseEvent) => {
            const f = e.features?.[0];
            if (!f?.properties) return;
            const id = String(f.properties.placeId ?? "");
            const label = String(f.properties.label ?? id);
            const code = String(f.properties.code ?? "");
            onFocusRef.current(id, label, code || undefined);
            openPop(e.lngLat, label, String(f.properties.kindLabel ?? ""), String(f.properties.note ?? ""));
            paintSel();
          };

          map.on("click", "blocks", hit);
          map.on("click", "flat", hit);
          map.on("click", "dongtan-pt", hit);
          for (const layer of ["blocks", "flat", "dongtan-pt"] as const) {
            map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
            map.on("mouseleave", layer, () => {
              map.getCanvas().style.cursor = "";
              tip.remove();
            });
          }
          const tipMove = (e: MapLayerMouseEvent) => {
            const f = e.features?.[0];
            const short = f?.properties?.short ? String(f.properties.short) : "";
            if (!short) return;
            tip.setLngLat(e.lngLat).setText(short).addTo(map);
          };
          map.on("mousemove", "blocks", tipMove);
          map.on("mousemove", "flat", tipMove);
          map.on("zoomend", () => { placeLabels(); });
          map.on("moveend", () => { placeLabels(); });
          map.once("idle", () => { placeLabels(); });

          fit.current = (id: string, code?: string | null) => {
            const feats = fcRef.current.features.filter((f) => {
              const p = f.properties as { placeId?: string; metro?: string; code?: string } | null;
              if (!p) return false;
              if (code && code !== id) return p.code === code;
              return p.placeId === id || p.metro === id;
            });
            if (id === "dongtan") {
              const d = REALTY_MAP_POINTS.find((x) => x.id === "dongtan");
              if (d) {
                map.easeTo({ center: [d.lng, d.lat], zoom: 10.4, pitch: 48, bearing: -16, duration: 700 });
                openPop([d.lng, d.lat], d.label, "규제 · 대출규제 · 7/1", d.note);
              }
              return;
            }
            const b = boundsOf(feats);
            if (!b) return;
            map.fitBounds(b, { padding: { top: 120, bottom: 72, left: 48, right: 48 }, pitch: 52, bearing: -16, maxZoom: 12, duration: 800 });
            map.once("moveend", () => placeLabels());
            pop.remove();
          };

          const cap = boundsOf(fcRef.current.features);
          if (cap) map.fitBounds(cap, { padding: { top: 40, bottom: 56, left: 36, right: 36 }, pitch: 32, bearing: -12, duration: 0 });
          let tries = 0;
          const kick = () => {
            placeLabels();
            if (markersRef.current.length > 0 || tries >= 8) return;
            tries += 1;
            setTimeout(kick, 200);
          };
          kick();
          if (focusRef.current) fit.current(focusRef.current, codeRef.current);
          map.resize();
        } catch (err) {
          console.error("realty map boot", err);
        }
      };
      map.on("load", boot);
      map.on("style.load", boot);
      if (map.loaded()) boot();
      requestAnimationFrame(() => boot());

      mapRef.current = map;
      timer = setTimeout(() => map.resize(), 80);
    })();
    return () => {
      dead = true;
      if (timer) clearTimeout(timer);
      for (const mk of markersRef.current) mk.remove();
      markersRef.current = [];
      for (const mk of moveMarkers.current) mk.remove();
      moveMarkers.current = [];
      popupRef.current?.remove();
      popupRef.current = null;
      skyMarker.current?.remove();
      skyMarker.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      fit.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("plan")) {
      fcRef.current = buildFc(heights);
      return;
    }
    fcRef.current = buildFc(heights);
    (map.getSource("plan") as GeoJSONSource).setData(fcRef.current);
  }, [heights]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const expr = highlightPaint(focusId, focusCode);
    const lift = heightPaint(focusId, focusCode);
    if (map.getLayer("blocks")) {
      map.setPaintProperty("blocks", "fill-extrusion-color", expr);
      map.setPaintProperty("blocks", "fill-extrusion-height", lift);
    }
    if (map.getLayer("flat")) map.setPaintProperty("flat", "fill-color", expr);
    for (const mk of markersRef.current) {
      const node = mk.getElement();
      const code = node.dataset.code ?? "";
      const id = node.dataset.placeId ?? "";
      const metro = node.dataset.metro ?? "";
      const on = focusCode && focusCode !== focusId
        ? code === focusCode
        : Boolean(focusId && (id === focusId || metro === focusId));
      node.classList.toggle("on", on);
    }
    if (focusId) fit.current?.(focusId, focusCode);
    const node = skyRef.current;
    const wrap = el.current?.parentElement;
    if (!focusId || !node) {
      skyMarker.current?.remove();
      skyMarker.current = null;
      if (node && wrap && node.parentElement !== wrap) wrap.appendChild(node);
      return;
    }
    const at = focusLngLat(fcRef.current, focusId, focusCode);
    const Ml = mlRef.current;
    if (!at || !Ml) return;
    if (!skyMarker.current) {
      skyMarker.current = new Ml.Marker({ element: node, anchor: "bottom", offset: [0, 8] }).setLngLat(at).addTo(map);
    } else {
      skyMarker.current.setLngLat(at);
    }
  }, [focusId, focusCode]);

  return (
    <div className="realty-map-column">
      <div className="realty-map-wrap">
        <div ref={el} className="realty-geo realty-plan" role="img" aria-label="전국 부동산 3D 도면" />
        <div className="realty-map-legend">
          <div><span className="dot danger" />대출규제·7/1</div>
          <div><span className="dot warn" />규제지역</div>
          <div><span className="dot info" />과밀억제</div>
          <div><span className="dot growth" />성장관리</div>
          <div><span className="dot nature" />자연보전</div>
          <div><span className="dot out" />수도권 밖</div>
          <p>{heights ? "고르면 그 지역만 올라옵니다. 기본 높이는 시도 대출 비율." : "고르면 그 지역만 올라옵니다. 대출 숫자가 없어 기본 높이는 아직 같습니다."}</p>
          <p>빨강·파랑은 수도권입니다. 지방 글씨의 →는 수도권으로, ←는 수도권에서 온 천 명입니다. 주황·초록은 지방끼리이고, 3대 전입·전출에 나온 이웃 시도 비중입니다.</p>
        </div>
        <RealtyMoveDetail focusId={focusId} />
        <div ref={skyRef} className="realty-skyline-slot">{children}</div>
      </div>
      <RealtyTenureDetail focusId={focusId} focusCode={focusCode} />
    </div>
  );
}
