"use client";
import { useEffect, useRef, useState } from "react";

// 공식 로더(s3.tradingview.com/external-embedding)가 iframe을 만든 뒤
// 바로 contentWindow에 message를 붙인다. React Strict Mode·테마 재마운트가
// iframe을 지우면 "contentWindow is not available"가 난다.
// 로더가 쓰는 것과 같은 tradingview-widget.com/embed-widget URL을 iframe src로 둔다.

const HOST = "https://www.tradingview-widget.com";

export type TvWidgetId =
  | "ticker-tape"
  | "market-overview"
  | "stock-heatmap"
  | "symbol-overview"
  | "screener"
  | "events"
  | "technical-analysis"
  | "forex-heat-map"
  | "crypto-coins-heatmap";

export function TvEmbed({
  widget,
  config,
  height,
  lazy = false,
}: {
  widget: TvWidgetId;
  config: Record<string, unknown>;
  height: number;
  lazy?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const cfg = JSON.stringify(config);
  const [shown, setShown] = useState(!lazy);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (shown) return;
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShown(true);
        io.disconnect();
      },
      { rootMargin: "160px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  useEffect(() => {
    if (!shown) return;
    const settings = JSON.parse(cfg) as Record<string, unknown>;
    const u = new URL(`${HOST}/embed-widget/${widget}/`);
    if (typeof settings.locale === "string") u.searchParams.set("locale", settings.locale);
    u.hash = encodeURIComponent(JSON.stringify({
      ...settings,
      width: "100%",
      height,
      utm_source: location.hostname,
      utm_medium: "widget",
      utm_campaign: widget,
    }));
    setSrc(u.toString());
  }, [shown, widget, cfg, height]);

  return (
    <div className="tv-embed" ref={box} style={{ height, minHeight: height }}>
      {src && (
        <iframe
          src={src}
          title={`${widget} TradingView`}
          loading={lazy ? "lazy" : "eager"}
          referrerPolicy="origin-when-cross-origin"
          style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        />
      )}
    </div>
  );
}
