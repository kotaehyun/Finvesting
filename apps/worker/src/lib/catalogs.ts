import {
  parseDartCorpCodeXml,
  parseSecCompanyTickers,
  type DartCorpEntry,
  type SecTickerEntry,
} from "@finvesting/core";
import { decodeDartCorpCodePayload } from "./zip";

export type CatalogLoad<T> = {
  status: "ok" | "empty" | "unavailable";
  catalog: Map<string, T>;
};

export async function loadDartCorpCatalog(apiKey: string): Promise<CatalogLoad<DartCorpEntry>> {
  try {
    const res = await fetch(`https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${encodeURIComponent(apiKey)}`);
    if (!res.ok) return { status: "unavailable", catalog: new Map() };
    const buf = Buffer.from(await res.arrayBuffer());
    const text = decodeDartCorpCodePayload(buf);
    if (text.trimStart().startsWith("{")) return { status: "unavailable", catalog: new Map() };
    const catalog = parseDartCorpCodeXml(text);
    return { status: catalog.size ? "ok" : "empty", catalog };
  } catch {
    return { status: "unavailable", catalog: new Map() };
  }
}

export async function loadSecTickerCatalog(userAgent: string): Promise<CatalogLoad<SecTickerEntry>> {
  try {
    const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: { "User-Agent": userAgent, Accept: "application/json" },
    });
    if (!res.ok) return { status: "unavailable", catalog: new Map() };
    const json: unknown = await res.json();
    const catalog = parseSecCompanyTickers(json);
    return { status: catalog.size ? "ok" : "empty", catalog };
  } catch {
    return { status: "unavailable", catalog: new Map() };
  }
}
