"use client";
import { useEffect, useRef } from "react";

// TradingView 공식 임베드. 스크립트 URL은 2026-09-13 GET 200 확인.
// 데이터는 저장하지 않고 iframe/위젯만 그린다.

export function TvEmbed({
  src,
  config,
  height,
}: {
  src: string;
  config: Record<string, unknown>;
  height: number;
}) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "tradingview-widget-container";
    wrap.style.height = `${height}px`;
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.height = "100%";
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = src;
    script.async = true;
    script.text = JSON.stringify(config);
    wrap.appendChild(inner);
    wrap.appendChild(script);
    el.appendChild(wrap);
    return () => { el.innerHTML = ""; };
  }, [src, height, JSON.stringify(config)]);

  return <div className="tv-embed" ref={box} style={{ minHeight: height }} />;
}
