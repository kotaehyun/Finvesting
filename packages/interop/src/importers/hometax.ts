/**
 * @file hometax.ts
 * 국세청 홈택스 연말정산 간소화 자료 파서
 * 
 * 1. 홈택스 간소화 표준 JSON 전자문서 파싱
 * 2. 홈택스 간소화 요약 CSV/XLSX 파싱
 * 
 * 공제 항목 매핑:
 * - 연금계좌 (연금저축, IRP)
 * - 보장성 보험료
 * - 주택마련저축 (주택청약종합저축)
 * - 신용카드 / 직불(체크)카드 / 현금영수증
 * - 의료비, 교육비, 기부금
 */

import { toNumber } from "../parse-file";

export interface HometaxParsedItem {
  category: "pension" | "irp" | "housing" | "insurance" | "credit_card" | "debit_card" | "cash_receipt" | "medical" | "education" | "donation" | "other";
  categoryName: string;
  institution?: string; // 금융회사/상호명
  itemName?: string; // 상품명/증빙명
  amount: number; // 연간 불입/사용 금액
  applicantName?: string; // 명의자 (본인/부양가족)
}

export interface HometaxDeductionSummary {
  year?: number;
  userName?: string;
  pensionSavingsContribution: number; // 연금저축 납입액
  irpContribution: number; // IRP 퇴직연금 납입액
  housingSubscriptionDeposit: number; // 주택청약 납입액
  insurancePremiumPaid: number; // 보장성 보험료
  creditCardSpent: number; // 신용카드
  debitCardCashSpent: number; // 체크카드 + 현금영수증
  medicalExpense: number; // 의료비
  educationExpense: number; // 교육비
  donationExpense: number; // 기부금
  items: HometaxParsedItem[];
  rawCount: number;
}

/**
 * 1. 홈택스 간소화 JSON 파싱
 * (국세청 홈택스 연말정산 간소화 전자문서 표준 형식)
 */
export function parseHometaxJson(jsonStr: string): HometaxDeductionSummary {
  let data: any;
  try {
    data = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error("유효하지 않은 홈택스 JSON 형식입니다.");
  }

  const items: HometaxParsedItem[] = [];
  let year: number | undefined;
  let userName: string | undefined;

  // 국세청 표준 필드 검사 (doc, form, man 구조 또는 간소화 커스텀 JSON)
  const doc = data.doc ?? data;
  if (doc.docType || doc.attYr) {
    year = Number(doc.attYr) || (doc.year ? Number(doc.year) : undefined);
  }

  // 홈택스 표준 man (인별) 배열 순회
  const manList = Array.isArray(doc.man) ? doc.man : (Array.isArray(doc.persons) ? doc.persons : [doc]);

  for (const man of manList) {
    if (!userName && man.name) userName = String(man.name);

    // 1) 연금계좌 / 퇴직연금 (form: P101M, P102M 등)
    // 2) 보험료 (A102Y, A102M)
    // 3) 주택마련저축 (J301Y)
    // 4) 신용카드/직불카드/현금영수증 (G107Y, G207Y, G307Y 등)
    // 5) 의료비 (B101Y), 교육비 (C101Y), 기부금 (F101Y)

    // 일반화된 포맷 지원 (form 리스트 또는 직접 필드 배열)
    const forms = Array.isArray(man.form) ? man.form : (Array.isArray(man.items) ? man.items : []);

    for (const f of forms) {
      const formCd = String(f.formCd || f.category || "").toUpperCase();
      const formName = String(f.formNm || f.name || "");
      const instName = String(f.tradeNm || f.busnid || f.institution || "");

      // 금액 필드 추출 (sum, ddc, amt, amount 등)
      const amt = Number(f.amt || f.sum || f.amount || f.ddc || 0);

      const parsedCategory = classifyHometaxCategory(formCd, formName);
      if (parsedCategory && amt > 0) {
        items.push({
          category: parsedCategory,
          categoryName: formName || getCategoryLabel(parsedCategory),
          institution: instName || undefined,
          amount: amt,
          applicantName: man.name || undefined,
        });
      }
    }

    // 또는 flat object 형식 (예: { pensionSavings: 3000000, creditCard: 12000000 ... })
    for (const [key, val] of Object.entries(man)) {
      if (typeof val === "number" && val > 0) {
        const cat = mapJsonKeyToCategory(key);
        if (cat) {
          items.push({
            category: cat,
            categoryName: getCategoryLabel(cat),
            amount: val,
            applicantName: man.name || undefined,
          });
        }
      }
    }
  }

  return summarizeHometaxItems(items, year, userName);
}

/**
 * 2. 홈택스 간소화 CSV 또는 XLSX 테이블 행 파싱
 */
export function parseHometaxRows(rows: string[][]): HometaxDeductionSummary {
  const items: HometaxParsedItem[] = [];
  if (!rows || rows.length === 0) {
    return summarizeHometaxItems([], undefined, undefined);
  }

  // 헤더 탐색: "서식명", "항목", "금액", "상호" 등
  const headerIdx = rows.findIndex((r) =>
    r.some((c) => /항목|구분|서식|종류/i.test(c)) &&
    r.some((c) => /금액|납입|지출/i.test(c)),
  );

  const startRow = headerIdx >= 0 ? headerIdx + 1 : 0;
  const header = headerIdx >= 0 ? rows[headerIdx]! : [];

  const colIdx = {
    category: header.findIndex((c) => /서식|항목|구분|종류/i.test(c)),
    name: header.findIndex((c) => /상호|기관|상품|내역/i.test(c)),
    amount: header.findIndex((c) => /금액|합계|납입|지출/i.test(c)),
    person: header.findIndex((c) => /이름|명의|대상자/i.test(c)),
  };

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i]!;
    if (row.length < 2) continue;

    const catText = colIdx.category >= 0 ? (row[colIdx.category] ?? "") : row[0] ?? "";
    const nameText = colIdx.name >= 0 ? (row[colIdx.name] ?? "") : row[1] ?? "";
    const amtText = colIdx.amount >= 0 ? (row[colIdx.amount] ?? "") : row[2] ?? "";
    const personText = colIdx.person >= 0 ? (row[colIdx.person] ?? "") : undefined;

    const amt = toNumber(amtText);
    if (amt <= 0) continue;

    const cat = classifyHometaxCategory(catText, nameText);
    if (cat) {
      items.push({
        category: cat,
        categoryName: catText || getCategoryLabel(cat),
        itemName: nameText || undefined,
        amount: amt,
        applicantName: personText,
      });
    }
  }

  return summarizeHometaxItems(items, undefined, undefined);
}

function classifyHometaxCategory(codeOrName: string, subName: string = ""): HometaxParsedItem["category"] | null {
  const s = `${codeOrName} ${subName}`.toLowerCase();

  // 1. 퇴직연금 (IRP / DC추가납입 / P101) - P101은 퇴직연금
  if (/퇴직연금|irp|dc추가|p101/i.test(s)) return "irp";

  // 2. 연금저축 (개인연금저축 / 연금계좌 / P102)
  if (/연금저축|개인연금|연금계좌|p102/i.test(s)) return "pension";

  // 3. 주택청약 (주택마련저축 / J301)
  if (/주택마련|청약|주택청약|j301/i.test(s)) return "housing";

  // 4. 보장성 보험 (A102)
  if (/보장성|보험|실손|암보험|a102/i.test(s)) return "insurance";

  // 5. 카드
  if (/신용카드|g107/i.test(s)) return "credit_card";
  if (/직불카드|체크카드|g207/i.test(s)) return "debit_card";
  if (/현금영수증|g307/i.test(s)) return "cash_receipt";

  // 6. 기타 의료/교육/기부
  if (/의료비|b101/i.test(s)) return "medical";
  if (/교육비|c101/i.test(s)) return "education";
  if (/기부금|f101/i.test(s)) return "donation";

  return null;
}

function mapJsonKeyToCategory(key: string): HometaxParsedItem["category"] | null {
  const k = key.toLowerCase();
  if (k.includes("pension") || k.includes("annuity")) return "pension";
  if (k.includes("irp")) return "irp";
  if (k.includes("housing") || k.includes("subscription")) return "housing";
  if (k.includes("insurance")) return "insurance";
  if (k.includes("creditcard") || k.includes("credit_card")) return "credit_card";
  if (k.includes("debitcard") || k.includes("debit_card") || k.includes("checkcard")) return "debit_card";
  if (k.includes("cashreceipt") || k.includes("cash_receipt")) return "cash_receipt";
  if (k.includes("medical")) return "medical";
  if (k.includes("education")) return "education";
  if (k.includes("donation")) return "donation";
  return null;
}

function getCategoryLabel(cat: HometaxParsedItem["category"]): string {
  switch (cat) {
    case "pension": return "연금저축";
    case "irp": return "퇴직연금(IRP)";
    case "housing": return "주택청약종합저축";
    case "insurance": return "보장성 보험료";
    case "credit_card": return "신용카드";
    case "debit_card": return "직불·체크카드";
    case "cash_receipt": return "현금영수증";
    case "medical": return "의료비";
    case "education": return "교육비";
    case "donation": return "기부금";
    default: return "기타";
  }
}

function summarizeHometaxItems(
  items: HometaxParsedItem[],
  year?: number,
  userName?: string,
): HometaxDeductionSummary {
  let pensionSavingsContribution = 0;
  let irpContribution = 0;
  let housingSubscriptionDeposit = 0;
  let insurancePremiumPaid = 0;
  let creditCardSpent = 0;
  let debitCardCashSpent = 0;
  let medicalExpense = 0;
  let educationExpense = 0;
  let donationExpense = 0;

  for (const item of items) {
    switch (item.category) {
      case "pension":
        pensionSavingsContribution += item.amount;
        break;
      case "irp":
        irpContribution += item.amount;
        break;
      case "housing":
        housingSubscriptionDeposit += item.amount;
        break;
      case "insurance":
        insurancePremiumPaid += item.amount;
        break;
      case "credit_card":
        creditCardSpent += item.amount;
        break;
      case "debit_card":
      case "cash_receipt":
        debitCardCashSpent += item.amount;
        break;
      case "medical":
        medicalExpense += item.amount;
        break;
      case "education":
        educationExpense += item.amount;
        break;
      case "donation":
        donationExpense += item.amount;
        break;
    }
  }

  return {
    year,
    userName,
    pensionSavingsContribution,
    irpContribution,
    housingSubscriptionDeposit,
    insurancePremiumPaid,
    creditCardSpent,
    debitCardCashSpent,
    medicalExpense,
    educationExpense,
    donationExpense,
    items,
    rawCount: items.length,
  };
}
