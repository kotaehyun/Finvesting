import { describe, expect, it } from "vitest";
import { summarizeByAccount, summarizeByClass } from "./holdings-summary";

const row = (o: Partial<{ accountId: string; assetClass: string; quantity: number; marketValueKrw: number | null; costKrw: number; pnlKrw: number | null }>) => ({
  accountId: "a",
  assetClass: "stock",
  quantity: 1,
  marketValueKrw: 0,
  costKrw: 0,
  pnlKrw: 0,
  ...o,
});

describe("summarizeByClass", () => {
  it("보유가 없어도 주식·ETF·채권·펀드·코인·기타를 0으로 돌려준다", () => {
    const r = summarizeByClass([]);
    expect(r.map((x) => x.assetClass)).toEqual(["stock", "etf", "bond", "fund", "crypto", "other"]);
    expect(r.every((x) => x.count === 0 && x.weight === 0)).toBe(true);
  });

  it("같은 종목이 다른 계좌면 자산군 건수를 따로 센다", () => {
    const r = summarizeByClass([
      row({ accountId: "키움", assetClass: "stock", marketValueKrw: 100, costKrw: 80, pnlKrw: 20 }),
      row({ accountId: "한투", assetClass: "stock", quantity: 2, marketValueKrw: 200, costKrw: 200, pnlKrw: 0 }),
      row({ accountId: "키움", assetClass: "etf", marketValueKrw: 50, costKrw: 40, pnlKrw: 10 }),
      row({ accountId: "키움", assetClass: "bond", quantity: 0, marketValueKrw: 0, costKrw: 0, pnlKrw: 0 }),
    ]);
    const stock = r.find((x) => x.assetClass === "stock")!;
    expect(stock.count).toBe(2);
    expect(stock.marketValueKrw).toBe(300);
    expect(stock.weight).toBeCloseTo(300 / 350);
    expect(r.find((x) => x.assetClass === "etf")!.count).toBe(1);
    expect(r.find((x) => x.assetClass === "bond")!.count).toBe(0);
  });
});

describe("summarizeByAccount", () => {
  it("증권·코인·연금 계좌는 보유가 없어도 보여 주고 입출금은 숨긴다", () => {
    const r = summarizeByAccount([], [
      { id: "k", name: "키움", institution: "키움증권", type: "brokerage", balance: 1_000_000 },
      { id: "u", name: "업비트", institution: "업비트", type: "crypto", balance: 0 },
      { id: "c", name: "입출금", institution: "카카오", type: "checking", balance: 100 },
    ]);
    expect(r.map((x) => x.accountId)).toEqual(["k", "u"]);
    expect(r.every((x) => x.count === 0)).toBe(true);
  });

  it("체결이 있는 입출금 계좌는 보여 준다", () => {
    const r = summarizeByAccount(
      [row({ accountId: "c", assetClass: "stock", marketValueKrw: 10, costKrw: 10, pnlKrw: 0 })],
      [
        { id: "c", name: "입출금", institution: "카카오", type: "checking", balance: 100 },
        { id: "k", name: "키움", institution: "키움증권", type: "brokerage", balance: 0 },
      ],
    );
    expect(r.map((x) => x.accountId)).toEqual(["c", "k"]);
    expect(r[0]!.count).toBe(1);
    expect(r[0]!.marketValueKrw).toBe(10);
    expect(r[0]!.weight).toBe(1);
    expect(r[1]!.count).toBe(0);
  });
});
