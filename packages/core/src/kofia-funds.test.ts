import { describe, expect, it } from "vitest";
import {
  creditShare,
  kofiaFundsTotal,
  kofiaMdToIso,
  marginShare,
  millionWonToJo,
  parseKofiaMainHtml,
  parseKofiaYear,
} from "./kofia-funds";

const SAMPLE = `
[2026-09-14] 신용공여통계관리 통계가 발표되었습니다.
<dt class="chart-name"><a href="#" onclick="clickJisuMenu('OS0021')">투자자예탁금</a></dt>
<dd class="etc"><span class="dan">백만원</span> | <span class="date">09/14</span></dd>
<dd class="chart-num"><span class="num1">106,817,908</span></dd>
<dt class="chart-name"><a href="#" onclick="clickJisuMenu('OS0026')">신용융자</a></dt>
<dd class="etc"><span class="dan">백만원</span> | <span class="date">09/14</span></dd>
<dd class="chart-num"><span class="num1">32,623,060</span></dd>
`;

describe("parseKofiaMainHtml", () => {
  it("메인 칸의 예탁금·신용을 읽고 미수금은 없으면 null", () => {
    const f = parseKofiaMainHtml(SAMPLE, 2025);
    expect(parseKofiaYear(SAMPLE, 2025)).toBe(2026);
    expect(f.asOf).toBe("2026-09-14");
    expect(f.deposit).toBe(106_817_908);
    expect(f.credit).toBe(32_623_060);
    expect(f.margin).toBeNull();
    expect(kofiaMdToIso("09/14", 2026)).toBe("2026-09-14");
  });
});

describe("비중", () => {
  it("미수금이 없으면 marginShare는 null, 신용 비중은 계산", () => {
    expect(marginShare({ deposit: 100, credit: 30, margin: null })).toBeNull();
    expect(creditShare({ deposit: 100, credit: 25 })).toBeCloseTo(0.2);
    expect(kofiaFundsTotal({ deposit: 100, credit: 30, margin: 5 })).toBe(135);
    expect(marginShare({ deposit: 100, credit: 30, margin: 5 })).toBeCloseTo(5 / 135);
    expect(millionWonToJo(1_000_000)).toBe(1);
  });
});
