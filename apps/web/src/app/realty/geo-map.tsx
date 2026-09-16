"use client";
import {
  REALTY_MAP_POINTS,
  REALTY_MAP_VIEW,
  REALTY_METROS,
  planExtrudeMeters,
  realtyMetroForPlace,
  realtyPlanFromKostat,
  type RealtyMetroId,
  type RealtyPlanStyle,
} from "@finvesting/core";
import { useEffect, useRef } from "react";
import type { DataDrivenPropertyValueSpecification, GeoJSONSource, LngLatLike, Map as MlMap, MapLayerMouseEvent, Marker, Popup } from "maplibre-gl";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import plan from "./korea-plan.json";

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

function highlightPaint(focusId: string | null, focusCode: string | null): DataDrivenPropertyValueSpecification<string> {
  if (focusCode) {
    return ["case", ["==", ["get", "code"], focusCode], "#f59e0b", ["get", "color"]] as DataDrivenPropertyValueSpecification<string>;
  }
  if (focusId) {
    return ["case", ["==", ["get", "placeId"], focusId], "#f59e0b", ["get", "color"]] as DataDrivenPropertyValueSpecification<string>;
  }
  return ["get", "color"];
}

export function RealtyGeoMap({
  focusId,
  focusCode,
  heights,
  onFocus,
}: {
  focusId: string | null;
  focusCode: string | null;
  heights: Record<RealtyMetroId, number> | null;
  onFocus: (id: string, label: string, code?: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const markersRef = useRef<Marker[]>([]);
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
        if (map.getLayer("blocks")) map.setPaintProperty("blocks", "fill-extrusion-color", expr);
        if (map.getLayer("flat")) map.setPaintProperty("flat", "fill-color", expr);
        for (const mk of markersRef.current) {
          const node = mk.getElement();
          const code = node.dataset.code ?? "";
          const id = node.dataset.placeId ?? "";
          const on = codeRef.current ? code === codeRef.current : Boolean(focusRef.current && id === focusRef.current);
          node.classList.toggle("on", on);
        }
      };

      const placeLabels = () => {
        for (const mk of markersRef.current) mk.remove();
        markersRef.current = [];
        const add = (lng: number, lat: number, p: PlanProps) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "plan-label";
          btn.textContent = p.short;
          btn.style.fontSize = px;
          btn.dataset.code = p.code;
          btn.dataset.placeId = p.placeId;
          btn.dataset.metro = p.metro;
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const code = p.code !== p.metro ? p.code : undefined;
            onFocusRef.current(p.placeId, p.label, code);
            openPop([lng, lat], p.label, p.kindLabel, p.note);
          });
          const mk = new maplibregl.Marker({ element: btn, anchor: "center" }).setLngLat([lng, lat]).addTo(map);
          markersRef.current.push(mk);
        };
        const z = map.getZoom();
        const px = z < 6.5 ? "12px" : z < 8 ? "10px" : z < 9.5 ? "12px" : "13px";
        if (z < 6.7) {
          for (const c of metroCentroids(fcRef.current)) {
            add(c.lng, c.lat, {
              code: c.id,
              placeId: c.id,
              metro: c.id,
              label: c.label,
              short: c.label,
              kindLabel: "광역시도",
              note: "예금은행 가계대출은 이 시도 말잔입니다. 시·구 숫자는 없습니다.",
            });
          }
        } else {
          const box = map.getBounds();
          for (const f of fcRef.current.features) {
            if (!f.geometry) continue;
            const xy = labelLngLat(f.geometry);
            const p = f.properties as PlanProps | null;
            if (!xy || !p?.short) continue;
            if (!box.contains([xy[0], xy[1]])) continue;
            add(xy[0], xy[1], p);
          }
          const dongtan = REALTY_MAP_POINTS.find((x) => x.id === "dongtan");
          if (dongtan && box.contains([dongtan.lng, dongtan.lat])) {
            add(dongtan.lng, dongtan.lat, {
              code: "dongtan",
              placeId: "dongtan",
              metro: "gyeonggi",
              label: dongtan.label,
              short: "동탄구",
              kindLabel: "규제 · 대출규제 · 7/1",
              note: dongtan.note,
            });
          }
        }
        paintSel();
      };

      const boot = () => {
        if (dead || map.getSource("plan")) return;
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
          map.on("moveend", () => { if (map.getZoom() >= 6.7) placeLabels(); });

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
            map.fitBounds(b, { padding: { top: 48, bottom: 72, left: 40, right: 40 }, pitch: 48, bearing: -16, maxZoom: 12, duration: 800 });
            map.once("moveend", () => placeLabels());
            const first = feats[0]?.properties as { label?: string; kindLabel?: string; note?: string } | undefined;
            if (first?.label) {
              const [[x0, y0], [x1, y1]] = b;
              openPop([(x0 + x1) / 2, (y0 + y1) / 2], first.label, first.kindLabel ?? "", first.note ?? "");
            }
          };

          const cap = boundsOf(fcRef.current.features);
          if (cap) map.fitBounds(cap, { padding: { top: 40, bottom: 56, left: 36, right: 36 }, pitch: 32, bearing: -12, duration: 0 });
          placeLabels();
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
      popupRef.current?.remove();
      popupRef.current = null;
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
    if (map.getLayer("blocks")) map.setPaintProperty("blocks", "fill-extrusion-color", expr);
    if (map.getLayer("flat")) map.setPaintProperty("flat", "fill-color", expr);
    for (const mk of markersRef.current) {
      const node = mk.getElement();
      const code = node.dataset.code ?? "";
      const id = node.dataset.placeId ?? "";
      const on = focusCode ? code === focusCode : Boolean(focusId && id === focusId);
      node.classList.toggle("on", on);
    }
    if (!focusId) return;
    fit.current?.(focusId, focusCode);
  }, [focusId, focusCode]);

  return (
    <div className="realty-map-wrap">
      <div ref={el} className="realty-geo realty-plan" role="img" aria-label="전국 부동산 3D 도면" />
      <div className="realty-map-legend">
        <div><span className="dot danger" />대출규제·7/1</div>
        <div><span className="dot warn" />규제지역</div>
        <div><span className="dot info" />과밀억제</div>
        <div><span className="dot growth" />성장관리</div>
        <div><span className="dot nature" />자연보전</div>
        <div><span className="dot" style={{ background: "#9aa3ad" }} />수도권 밖</div>
        <div className="muted" style={{ marginTop: 4 }}>멀리서는 시도, 가까이서는 시·구. 높이 = 시도 대출 비율</div>
      </div>
    </div>
  );
}
