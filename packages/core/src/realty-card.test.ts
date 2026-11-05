import { describe, expect, it } from "vitest";
import {
  REALTY_CARD_NPL,
  REALTY_REVOLVING,
  cardLoanShareOfCardCredit,
  eokToJo1,
  revolvingShareOfCardCredit,
} from "./realty-card";

describe("realty card", () => {
  it("카드 연체와 리볼빙 잔액 비율을 집계로만 둔다", () => {
    expect(REALTY_CARD_NPL.all).toBe(1.54);
    expect(REALTY_CARD_NPL.loan).toBe(3.35);
    expect(REALTY_REVOLVING.revolveEok + REALTY_REVOLVING.cardLoanEok + REALTY_REVOLVING.cashEok).toBe(566_967);
    expect(revolvingShareOfCardCredit()).toBeCloseTo(68_759 / 566_967, 6);
    expect(cardLoanShareOfCardCredit()).toBeGreaterThan(revolvingShareOfCardCredit());
    expect(eokToJo1(68_759)).toBeCloseTo(6.8759, 4);
  });
});
