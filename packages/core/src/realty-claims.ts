// 유튜브·커뮤니티에서 자주 도는 말 vs 공식 근거. 특정 채널을 긁지 않는다.
// 기사 제목 키워드만 매칭. 본문 저장 금지. 매수 권유가 아님.
import dataFile from "../data/realty/claims.json";
import { assertDataFile } from "./load-data";

assertDataFile(dataFile as any, "realty/claims.json");


export type RealtyClaimVerdict = "overstated" | "partial" | "needs-source";

export type RealtyClaimFact = { label: string; value: string };

export type RealtyClaim = {
  id: string;
  buzz: string;
  official: string;
  verdict: RealtyClaimVerdict;
  verdictLabel: string;
  tags: readonly string[];
  facts?: readonly RealtyClaimFact[];
};

export const REALTY_CLAIM_MIX = (dataFile as any).exports.REALTY_CLAIM_MIX as any;

export const REALTY_CLAIMS: readonly RealtyClaim[] = (dataFile as any).exports.REALTY_CLAIMS as any;

export function realtyClaimsForTitle(title: string): RealtyClaim[] {
  const t = title.replace(/\s+/g, "");
  return REALTY_CLAIMS.filter((c) => c.tags.some((tag) => t.includes(tag)));
}
