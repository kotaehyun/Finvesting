import { describe, expect, it } from "vitest";
import {
  absoluteTriangleScore,
  buildValuationTriangle,
  fillMissingPerPbr,
  hasValuationTriangleMetrics,
  missingValuationTriangleFields,
  peerRankScore,
  valuationTrianglePolygon,
} from "./valuation-triangle";

describe("valuation-triangle", () => {
  it("시총·순이익·ROE로 빈 PER·PBR을 채운다", () => {
    const f = fillMissingPerPbr({
      per: null,
      pbr: null,
      roe: 0.4158,
      marketCap: 1_295_222_281_601_024,
      netIncomeTtm: 212_962_144_944_128,
      market: "KRX",
    });
    expect(f.filledPer).toBe(true);
    expect(f.filledPbr).toBe(true);
    expect(f.per).toBeCloseTo(1_295_222_281_601_024 / 212_962_144_944_128, 4);
    expect(f.pbr).toBeCloseTo((f.per as number) * 0.4158, 4);
    expect(hasValuationTriangleMetrics({ roe: 0.4158, per: f.per, pbr: f.pbr })).toBe(true);
  });

  it("통화가 다르면 시총추정 PER을 채우지 않는다", () => {
    const f = fillMissingPerPbr({
      per: null,
      pbr: null,
      roe: 0.2,
      marketCap: 100,
      netIncomeTtm: 10,
      currency: "USD",
      financialCurrency: "TWD",
      market: "US",
    });
    expect(f).toEqual({ per: null, pbr: null, filledPer: false, filledPbr: false });
  });

  it("이미 있는 PER·PBR은 덮지 않는다", () => {
    const f = fillMissingPerPbr({
      per: 12,
      pbr: 1.5,
      roe: 0.2,
      marketCap: 100,
      netIncomeTtm: 10,
      currency: "USD",
      financialCurrency: "USD",
    });
    expect(f).toEqual({ per: 12, pbr: 1.5, filledPer: false, filledPbr: false });
  });

  it("세 값 중 하나라도 없으면 empty", () => {
    expect(buildValuationTriangle({ roe: 0.2, per: 10, pbr: null }).status).toBe("empty");
    expect(buildValuationTriangle({ roe: 0.2, per: -1, pbr: 1 }).status).toBe("empty");
    expect(hasValuationTriangleMetrics({ roe: 0.4, per: null, pbr: null })).toBe(false);
    expect(missingValuationTriangleFields({ roe: 0.4, per: null, pbr: null })).toEqual(["PER", "PBR"]);
  });

  it("절대 축: ROE 높을수록·PER/PBR 낮을수록 score↑", () => {
    expect(absoluteTriangleScore("roe", 0.15)).toBeCloseTo(0.5);
    expect(absoluteTriangleScore("roe", 0.3)).toBe(1);
    expect(absoluteTriangleScore("per", 20)).toBeCloseTo(0.5);
    expect(absoluteTriangleScore("pbr", 0)).toBe(0);
    expect(absoluteTriangleScore("pbr", 2.5)).toBeCloseTo(0.5);
  });

  it("피어 순위: 가장 높은 ROE는 1에 가깝다", () => {
    expect(peerRankScore(0.3, [0.1, 0.2, 0.3], true)).toBe(1);
    expect(peerRankScore(0.1, [0.1, 0.2, 0.3], true)).toBe(0);
    expect(peerRankScore(10, [10, 20, 30], false)).toBe(1);
  });

  it("피어 3개 이상이면 peer 스케일", () => {
    const t = buildValuationTriangle(
      { roe: 0.25, per: 8, pbr: 0.8 },
      [
        { roe: 0.1, per: 20, pbr: 2 },
        { roe: 0.2, per: 12, pbr: 1.2 },
        { roe: 0.25, per: 8, pbr: 0.8 },
      ],
    );
    expect(t.status).toBe("ok");
    expect(t.axes.every((a) => a.scale === "peer")).toBe(true);
    expect(t.axes.find((a) => a.id === "roe")?.score).toBe(1);
    expect(t.axes.find((a) => a.id === "per")?.score).toBe(1);
  });

  it("폴리곤 점은 세 꼭짓점", () => {
    const pts = valuationTrianglePolygon({ roe: 1, per: 1, pbr: 1 }, 100, 100, 80);
    expect(pts).toHaveLength(3);
    expect(pts[0]!.id).toBe("roe");
  });
});
