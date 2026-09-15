import { describe, expect, it } from "vitest";
import { REALTY_CORP_CHANNELS } from "./realty-corp";
import { REALTY_NTS_CGT, ntsCgtCorpPeopleShare, ntsCgtCorpTaxShare, ntsCgtWonPerHead } from "./realty-nts";

describe("realty corp", () => {
  it("4급·연예인은 넣지 않고 법인은 종부세 집계로 넣는다", () => {
    expect(REALTY_CORP_CHANNELS.find((c) => c.id === "grade4")?.put).toBe("never");
    expect(REALTY_CORP_CHANNELS.find((c) => c.id === "celeb")?.put).toBe("never");
    expect(REALTY_CORP_CHANNELS.find((c) => c.id === "corp")?.put).toBe("in");
    expect(ntsCgtCorpPeopleShare()).toBeCloseTo(59_000 / 540_000, 5);
    expect(ntsCgtCorpTaxShare()).toBeCloseTo(9_000 / 17_000, 5);
    expect(ntsCgtWonPerHead(REALTY_NTS_CGT.corpTaxEok, REALTY_NTS_CGT.corpPeople)).toBeCloseTo(15_254_237, 0);
  });
});
