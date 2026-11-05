/**
 * 표준 회계 분개(Double-Entry Journal) 생성 및 대차평형 검증 엔진
 * 더존 Smart A, 위하고(WEHAGO), 세무사랑 Pro 표준 연동 규격 지원
 */

export type AccountSide = "debit" | "credit";

export interface AccountSubject {
  code: string;
  name: string;
  category: "asset" | "liability" | "equity" | "revenue" | "expense";
}

/** 한국 표준 계정과목표 (일반전표 표준 매핑) */
export const STANDARD_CHART_OF_ACCOUNTS: Record<string, AccountSubject> = {
  // 자산 (100번대)
  "101": { code: "101", name: "현금", category: "asset" },
  "103": { code: "103", name: "보통예금", category: "asset" },
  "104": { code: "104", name: "정기예적금", category: "asset" },
  "107": { code: "107", name: "유가증권", category: "asset" },
  "120": { code: "120", name: "미수금", category: "asset" },
  "131": { code: "131", name: "선급금", category: "asset" },
  "136": { code: "136", name: "선납세금", category: "asset" },

  // 부채 (200번대)
  "251": { code: "251", name: "외상매입금", category: "liability" },
  "253": { code: "253", name: "미지급금(카드)", category: "liability" },
  "254": { code: "254", name: "예수금", category: "liability" },
  "260": { code: "260", name: "단기차입금", category: "liability" },

  // 자본 (300번대)
  "331": { code: "331", name: "자본금/인출금", category: "equity" },

  // 수익 (400, 500, 900번대)
  "401": { code: "401", name: "매출", category: "revenue" },
  "501": { code: "501", name: "급여수익", category: "revenue" },
  "903": { code: "903", name: "이자수익", category: "revenue" },
  "904": { code: "904", name: "배당금수익", category: "revenue" },
  "906": { code: "906", name: "유가증권처분이익", category: "revenue" },
  "930": { code: "930", name: "잡이익", category: "revenue" },

  // 비용 (800, 900번대 판관비 및 영업외비용)
  "801": { code: "801", name: "급여", category: "expense" },
  "811": { code: "811", name: "복리후생비", category: "expense" },
  "812": { code: "812", name: "여비교통비", category: "expense" },
  "813": { code: "813", name: "통신비", category: "expense" },
  "814": { code: "814", name: "수도광열비", category: "expense" },
  "815": { code: "815", name: "세금과공과", category: "expense" },
  "816": { code: "816", name: "지급임차료", category: "expense" },
  "819": { code: "819", name: "보험료", category: "expense" },
  "824": { code: "824", name: "지급수수료", category: "expense" },
  "830": { code: "830", name: "소모품비", category: "expense" },
  "831": { code: "831", name: "도서인쇄비", category: "expense" },
  "931": { code: "931", name: "이자비용", category: "expense" },
  "960": { code: "960", name: "유가증권처분손실", category: "expense" },
  "990": { code: "990", name: "잡손실", category: "expense" },
};

/** 지출 카테고리별 표준 계정과목 코드 판별 */
export function resolveExpenseAccountCode(category?: string): { code: string; name: string } {
  const cat = (category || "").toLowerCase();
  if (cat.includes("식비") || cat.includes("외식") || cat.includes("카페") || cat.includes("음식") || cat === "food") {
    return { code: "811", name: "복리후생비" };
  }
  if (cat.includes("교통") || cat.includes("대중교통") || cat.includes("주유") || cat.includes("택시") || cat === "transport") {
    return { code: "812", name: "여비교통비" };
  }
  if (cat.includes("통신") || cat.includes("인터넷") || cat.includes("휴대폰") || cat === "telecom") {
    return { code: "813", name: "통신비" };
  }
  if (cat.includes("관리비") || cat.includes("수도") || cat.includes("전기") || cat.includes("가스") || cat === "utility") {
    return { code: "814", name: "수도광열비" };
  }
  if (cat.includes("세금") || cat.includes("과태료") || cat.includes("공과금") || cat === "tax") {
    return { code: "815", name: "세금과공과" };
  }
  if (cat.includes("월세") || cat.includes("임차") || cat === "rent" || cat === "housing") {
    return { code: "816", name: "지급임차료" };
  }
  if (cat.includes("보험") || cat === "insurance") {
    return { code: "819", name: "보험료" };
  }
  if (cat.includes("수수료") || cat === "fee") {
    return { code: "824", name: "지급수수료" };
  }
  if (cat.includes("도서") || cat.includes("교육") || cat.includes("학원") || cat === "education") {
    return { code: "831", name: "도서인쇄비" };
  }
  if (cat.includes("이자") || cat === "interest") {
    return { code: "931", name: "이자비용" };
  }
  if (cat.includes("쇼핑") || cat.includes("마트") || cat.includes("생활") || cat === "shopping" || cat === "living") {
    return { code: "830", name: "소모품비" };
  }
  return { code: "990", name: "잡손실" };
}

/** 결제 계좌/수단 및 금융기관별 반대계정 코드 및 세부계정명 판별 */
export function resolveCounterAccountCode(
  accountType?: string,
  institution?: string
): { code: string; name: string } {
  const acc = (accountType || "").toLowerCase();
  const bankSuffix = institution ? `(${institution})` : "";

  if (acc.includes("card") || acc.includes("카드") || acc === "credit") {
    return { code: "253", name: `미지급금${bankSuffix || "(카드)"}` };
  }
  if (acc.includes("loan") || acc.includes("대출")) {
    return { code: "260", name: `단기차입금${bankSuffix}` };
  }
  if (acc.includes("saving") || acc.includes("적금") || acc.includes("예금") || acc.includes("installment")) {
    return { code: "104", name: `정기예적금${bankSuffix}` };
  }
  if (acc.includes("invest") || acc.includes("증권") || acc.includes("주식") || acc.includes("brokerage")) {
    return { code: "103", name: `보통예금${bankSuffix || "(투자예수금)"}` };
  }
  return { code: "103", name: `보통예금${bankSuffix}` };
}

export interface RawAccountingTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  accountType?: string;
  accountName?: string;
  institution?: string;
  type: "income" | "expense" | "transfer";
  category?: string;
  merchant?: string;
  description?: string;
  amount: number;
}

export interface RawAccountingInvestmentIncome {
  id: string;
  date: string;
  ticker?: string;
  name?: string;
  incomeType: "dividend" | "interest";
  accountName?: string;
  accountType?: string;
  institution?: string;
  grossAmount: number;
  netAmount: number;
  taxAmount: number;
}

export interface RawAccountingTrade {
  id: string;
  date: string;
  ticker: string;
  name?: string;
  side: "buy" | "sell";
  accountName?: string;
  accountType?: string;
  institution?: string;
  quantity: number;
  price: number;
  totalAmount: number;
  realizedPnl?: number; // 매도 시 실현손익
}

export interface RawAccountingPayroll {
  id: string;
  date: string; // YYYY-MM-DD
  grossIncome: number;
  netIncome: number;
  nationalPension?: number;
  healthInsurance?: number;
  employmentInsurance?: number;
  incomeTax?: number;
  localTax?: number;
  companyName?: string;
  receivingBank?: string;
  receivingAccountName?: string;
}

export interface JournalEntryLine {
  voucherNo: number; // 전표번호
  lineNo: number;    // 라인순번 (1, 2, ...)
  date: string;      // YYYY-MM-DD
  side: "debit" | "credit"; // 차변(debit) / 대변(credit)
  accountCode: string;
  accountName: string;
  counterparty: string; // 거래처
  amount: number;
  memo: string; // 적요
}

export interface JournalEntryGroup {
  voucherNo: number;
  date: string;
  sourceType: "transaction" | "dividend" | "interest" | "trade" | "payroll";
  lines: JournalEntryLine[];
  debitTotal: number;
  creditTotal: number;
  isBalanced: boolean;
}

export interface JournalSummary {
  totalVouchers: number;
  totalLines: number;
  debitSum: number;
  creditSum: number;
  difference: number;
  isAllBalanced: boolean;
  entries: JournalEntryGroup[];
}

export interface BuildJournalParams {
  transactions?: RawAccountingTransaction[];
  investmentIncomes?: RawAccountingInvestmentIncome[];
  trades?: RawAccountingTrade[];
  payrolls?: RawAccountingPayroll[];
  startDate?: string;
  endDate?: string;
}

/**
 * 복식부기 분개 그룹 빌더
 * 들어온 거래, 배당/이자, 주식매매, 급여 데이터를 회계 분개로 변환하고 대차평형을 맞춘다.
 */
export function buildJournalEntries(params: BuildJournalParams): JournalSummary {
  const groups: JournalEntryGroup[] = [];
  let voucherCounter = 1;

  // 1. 일반 거래 (Transactions)
  if (params.transactions) {
    for (const tx of params.transactions) {
      if (params.startDate && tx.date < params.startDate) continue;
      if (params.endDate && tx.date > params.endDate) continue;
      if (tx.amount <= 0) continue;

      const lines: JournalEntryLine[] = [];
      const memo = tx.description || tx.merchant || tx.category || "거래 내역";
      const bankOrInst = tx.institution || tx.accountName;
      const paymentAcc = resolveCounterAccountCode(tx.accountType, bankOrInst);
      const bankCounterparty = bankOrInst || "보통예금(은행)";

      if (tx.type === "expense") {
        // 비용 발생 (차변: 비용 계정, 대변: 결제계좌/카드)
        const expenseAcc = resolveExpenseAccountCode(tx.category);
        const expenseCounterparty = tx.merchant || "거래처미지정";
        lines.push({
          voucherNo: voucherCounter,
          lineNo: 1,
          date: tx.date,
          side: "debit",
          accountCode: expenseAcc.code,
          accountName: expenseAcc.name,
          counterparty: expenseCounterparty,
          amount: Math.round(tx.amount),
          memo,
        });
        lines.push({
          voucherNo: voucherCounter,
          lineNo: 2,
          date: tx.date,
          side: "credit",
          accountCode: paymentAcc.code,
          accountName: paymentAcc.name,
          counterparty: bankCounterparty,
          amount: Math.round(tx.amount),
          memo,
        });
      } else if (tx.type === "income") {
        // 수익 발생 (차변: 보통예금, 대변: 잡이익)
        const incomeCounterparty = tx.merchant || "거래처미지정";
        lines.push({
          voucherNo: voucherCounter,
          lineNo: 1,
          date: tx.date,
          side: "debit",
          accountCode: paymentAcc.code,
          accountName: paymentAcc.name,
          counterparty: bankCounterparty,
          amount: Math.round(tx.amount),
          memo,
        });
        lines.push({
          voucherNo: voucherCounter,
          lineNo: 2,
          date: tx.date,
          side: "credit",
          accountCode: "930",
          accountName: "잡이익",
          counterparty: incomeCounterparty,
          amount: Math.round(tx.amount),
          memo,
        });
      } else if (tx.type === "transfer") {
        // 계좌간 이체 (차변: 보통예금/적금, 대변: 보통예금)
        lines.push({
          voucherNo: voucherCounter,
          lineNo: 1,
          date: tx.date,
          side: "debit",
          accountCode: "104",
          accountName: `정기예적금${bankOrInst ? `(${bankOrInst})` : ""}`,
          counterparty: bankCounterparty,
          amount: Math.round(tx.amount),
          memo: `[이체입금] ${memo}`,
        });
        lines.push({
          voucherNo: voucherCounter,
          lineNo: 2,
          date: tx.date,
          side: "credit",
          accountCode: "103",
          accountName: `보통예금${bankOrInst ? `(${bankOrInst})` : ""}`,
          counterparty: bankCounterparty,
          amount: Math.round(tx.amount),
          memo: `[이체출금] ${memo}`,
        });
      }

      if (lines.length > 0) {
        const debitTotal = lines.filter((l) => l.side === "debit").reduce((sum, l) => sum + l.amount, 0);
        const creditTotal = lines.filter((l) => l.side === "credit").reduce((sum, l) => sum + l.amount, 0);
        groups.push({
          voucherNo: voucherCounter++,
          date: tx.date,
          sourceType: "transaction",
          lines,
          debitTotal,
          creditTotal,
          isBalanced: debitTotal === creditTotal,
        });
      }
    }
  }

  // 2. 배당 및 이자 소득 (Investment Incomes)
  if (params.investmentIncomes) {
    for (const inc of params.investmentIncomes) {
      if (params.startDate && inc.date < params.startDate) continue;
      if (params.endDate && inc.date > params.endDate) continue;
      if (inc.grossAmount <= 0) continue;

      const lines: JournalEntryLine[] = [];
      const isDiv = inc.incomeType === "dividend";
      const title = inc.name || inc.ticker || (isDiv ? "배당소득" : "이자소득");
      const revCode = isDiv ? "904" : "903";
      const revName = isDiv ? "배당금수익" : "이자수익";
      const bankOrBroker = inc.institution || inc.accountName || (isDiv ? "키움증권" : "토스뱅크");
      const depositAccName = `보통예금(${bankOrBroker})`;

      const netAmount = Math.round(inc.netAmount);
      const taxAmount = Math.round(inc.taxAmount);
      const grossAmount = Math.round(inc.grossAmount);

      // 차변: 보통예금(실수령액) - 은행/증권사 명시
      lines.push({
        voucherNo: voucherCounter,
        lineNo: 1,
        date: inc.date,
        side: "debit",
        accountCode: "103",
        accountName: depositAccName,
        counterparty: bankOrBroker,
        amount: netAmount,
        memo: `${title} ${isDiv ? "배당금" : "이자"} 실수령 입금`,
      });

      // 차변: 선납세금(원천징수세)
      if (taxAmount > 0) {
        lines.push({
          voucherNo: voucherCounter,
          lineNo: 2,
          date: inc.date,
          side: "debit",
          accountCode: "136",
          accountName: "선납세금",
          counterparty: `국세청(원천:${bankOrBroker})`,
          amount: taxAmount,
          memo: `${title} 원천징수 세액(15.4%)`,
        });
      }

      // 대변: 수익(세전 총액)
      lines.push({
        voucherNo: voucherCounter,
        lineNo: lines.length + 1,
        date: inc.date,
        side: "credit",
        accountCode: revCode,
        accountName: revName,
        counterparty: title,
        amount: grossAmount,
        memo: `${title} ${revName}(세전)`,
      });

      const debitTotal = lines.filter((l) => l.side === "debit").reduce((sum, l) => sum + l.amount, 0);
      const creditTotal = lines.filter((l) => l.side === "credit").reduce((sum, l) => sum + l.amount, 0);

      groups.push({
        voucherNo: voucherCounter++,
        date: inc.date,
        sourceType: inc.incomeType,
        lines,
        debitTotal,
        creditTotal,
        isBalanced: debitTotal === creditTotal,
      });
    }
  }

  // 3. 주식 매매 체결 (Trades)
  if (params.trades) {
    for (const trade of params.trades) {
      if (params.startDate && trade.date < params.startDate) continue;
      if (params.endDate && trade.date > params.endDate) continue;
      if (trade.totalAmount <= 0) continue;

      const lines: JournalEntryLine[] = [];
      const stockName = trade.name || trade.ticker;
      const totalAmount = Math.round(trade.totalAmount);
      const brokerOrBank = trade.institution || trade.accountName || "키움증권";
      const depositAccName = `보통예금(${brokerOrBank})`;

      if (trade.side === "buy") {
        // 주식 매수 (차변: 유가증권, 대변: 보통예금)
        lines.push({
          voucherNo: voucherCounter,
          lineNo: 1,
          date: trade.date,
          side: "debit",
          accountCode: "107",
          accountName: "유가증권",
          counterparty: stockName,
          amount: totalAmount,
          memo: `${stockName} ${trade.quantity}주 매수 취득`,
        });
        lines.push({
          voucherNo: voucherCounter,
          lineNo: 2,
          date: trade.date,
          side: "credit",
          accountCode: "103",
          accountName: depositAccName,
          counterparty: brokerOrBank,
          amount: totalAmount,
          memo: `${stockName} 주식 매수 대금 결제`,
        });
      } else {
        // 주식 매도 (차변: 보통예금 입금액, 대변: 유가증권 원가 + 처분손익)
        const pnl = Math.round(trade.realizedPnl || 0);
        const costBasis = Math.max(0, totalAmount - pnl);

        lines.push({
          voucherNo: voucherCounter,
          lineNo: 1,
          date: trade.date,
          side: "debit",
          accountCode: "103",
          accountName: depositAccName,
          counterparty: brokerOrBank,
          amount: totalAmount,
          memo: `${stockName} ${trade.quantity}주 매도 입금`,
        });

        if (pnl < 0) {
          // 처분손실 발생 (차변: 처분손실)
          lines.push({
            voucherNo: voucherCounter,
            lineNo: 2,
            date: trade.date,
            side: "debit",
            accountCode: "960",
            accountName: "유가증권처분손실",
            counterparty: stockName,
            amount: Math.abs(pnl),
            memo: `${stockName} 매매 처분손실`,
          });
          lines.push({
            voucherNo: voucherCounter,
            lineNo: 3,
            date: trade.date,
            side: "credit",
            accountCode: "107",
            accountName: "유가증권",
            counterparty: stockName,
            amount: costBasis,
            memo: `${stockName} 주식 매도(원가 상각)`,
          });
        } else {
          // 처분이익 발생 또는 본전 (대변: 원가 + 처분이익)
          lines.push({
            voucherNo: voucherCounter,
            lineNo: 2,
            date: trade.date,
            side: "credit",
            accountCode: "107",
            accountName: "유가증권",
            counterparty: stockName,
            amount: costBasis,
            memo: `${stockName} 주식 매도(원가 상각)`,
          });
          if (pnl > 0) {
            lines.push({
              voucherNo: voucherCounter,
              lineNo: 3,
              date: trade.date,
              side: "credit",
              accountCode: "906",
              accountName: "유가증권처분이익",
              counterparty: stockName,
              amount: pnl,
              memo: `${stockName} 매매 처분이익`,
            });
          }
        }
      }

      const debitTotal = lines.filter((l) => l.side === "debit").reduce((sum, l) => sum + l.amount, 0);
      const creditTotal = lines.filter((l) => l.side === "credit").reduce((sum, l) => sum + l.amount, 0);

      groups.push({
        voucherNo: voucherCounter++,
        date: trade.date,
        sourceType: "trade",
        lines,
        debitTotal,
        creditTotal,
        isBalanced: debitTotal === creditTotal,
      });
    }
  }

  // 4. 급여 전표 (Payroll)
  if (params.payrolls) {
    for (const pr of params.payrolls) {
      if (params.startDate && pr.date < params.startDate) continue;
      if (params.endDate && pr.date > params.endDate) continue;
      if (pr.grossIncome <= 0) continue;

      const lines: JournalEntryLine[] = [];
      const company = pr.companyName || "급여지급처";
      const receivingBank = pr.receivingBank || pr.receivingAccountName || "KB국민은행";
      const depositAccName = `보통예금(${receivingBank})`;
      const gross = Math.round(pr.grossIncome);
      const sumDeductions = (pr.nationalPension ?? 0) + (pr.healthInsurance ?? 0) + (pr.employmentInsurance ?? 0) + (pr.incomeTax ?? 0) + (pr.localTax ?? 0);
      const net = Math.round(pr.netIncome > 0 ? pr.netIncome : gross - sumDeductions);
      const totalDeductions = Math.max(0, gross - net);

      // 차변: 보통예금 (실수령액) - 입금 은행명 명시
      lines.push({
        voucherNo: voucherCounter,
        lineNo: 1,
        date: pr.date,
        side: "debit",
        accountCode: "103",
        accountName: depositAccName,
        counterparty: receivingBank,
        amount: net,
        memo: "급여 실수령액 입금",
      });

      // 차변: 예수금(원천세 및 4대보험 공제분) - 국세청/공단 명시
      if (totalDeductions > 0) {
        lines.push({
          voucherNo: voucherCounter,
          lineNo: 2,
          date: pr.date,
          side: "debit",
          accountCode: "254",
          accountName: "예수금(원천세/4대보험)",
          counterparty: "국세청/국민건강보험공단",
          amount: totalDeductions,
          memo: "4대보험 및 원천징수 소득세 공제",
        });
      }

      // 대변: 급여수익 (세전 총액)
      lines.push({
        voucherNo: voucherCounter,
        lineNo: lines.length + 1,
        date: pr.date,
        side: "credit",
        accountCode: "501",
        accountName: "급여수익",
        counterparty: company,
        amount: gross,
        memo: "월 급여 총액(세전)",
      });

      const debitTotal = lines.filter((l) => l.side === "debit").reduce((sum, l) => sum + l.amount, 0);
      const creditTotal = lines.filter((l) => l.side === "credit").reduce((sum, l) => sum + l.amount, 0);

      groups.push({
        voucherNo: voucherCounter++,
        date: pr.date,
        sourceType: "payroll",
        lines,
        debitTotal,
        creditTotal,
        isBalanced: debitTotal === creditTotal,
      });
    }
  }

  // 날짜순 정렬 후 전표번호 재부여
  groups.sort((a, b) => a.date.localeCompare(b.date));
  let finalNo = 1;
  for (const g of groups) {
    g.voucherNo = finalNo++;
    for (const l of g.lines) {
      l.voucherNo = g.voucherNo;
    }
  }

  const totalLines = groups.reduce((acc, g) => acc + g.lines.length, 0);
  const debitSum = groups.reduce((acc, g) => acc + g.debitTotal, 0);
  const creditSum = groups.reduce((acc, g) => acc + g.creditTotal, 0);

  return {
    totalVouchers: groups.length,
    totalLines,
    debitSum,
    creditSum,
    difference: debitSum - creditSum,
    isAllBalanced: groups.every((g) => g.isBalanced) && debitSum === creditSum,
    entries: groups,
  };
}
