// 외부 파일(은행·카드·증권 내보내기, 회계 프로그램) ↔ Finvesting 내부 모델 변환 계약.
// 순수 함수만. DB 접근 없음 — 파싱 결과를 api 계층이 저장한다.

export type ParsedTransaction = {
  date: string;                 // YYYY-MM-DD
  amount: number;               // 양수
  direction: "in" | "out";
  merchant?: string;
  memo?: string;
  balanceAfter?: number;        // 통장 잔액 (있으면 잔액 검증에 사용)
  raw: Record<string, unknown>; // 원본 행
};

export type ParsedTrade = {
  tradedAt: string;             // ISO
  symbol: string;
  market: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  fee?: number;
  tax?: number;
  currency: string;
  raw: Record<string, unknown>;
};

export type ImportResult<T> = {
  rows: T[];
  skipped: Array<{ line: number; reason: string }>;
  detected: string;             // 어떤 포맷으로 인식했는지 (예: "kakaobank-csv")
};

export interface TransactionImporter {
  id: string;                   // "kakaobank" | "shinhan-card" | "toss" | "generic"
  label: string;
  /** 헤더/샘플 행을 보고 이 포맷인지 판별 */
  detect(headers: string[], sample: string[][]): boolean;
  parse(rows: string[][]): ImportResult<ParsedTransaction>;
}

export interface TradeImporter {
  id: string;                   // "kis" | "kiwoom" | "upbit" | "generic"
  label: string;
  detect(headers: string[], sample: string[][]): boolean;
  parse(rows: string[][]): ImportResult<ParsedTrade>;
}

// 내보내기: 회계 프로그램(더존·위하고·세무사랑)이나 세무사 전달용 표준 형태
export type LedgerRow = {
  date: string;
  account: string;              // 계정과목 (예: "복리후생비")
  debit: number;
  credit: number;
  description: string;
  counterparty?: string;
  evidence?: string;            // 증빙 종류: 세금계산서/현금영수증/카드/기타
  memo?: string;
};

export interface LedgerExporter {
  id: string;                   // "generic-csv" | "douzone" | "wehago" | "semusarang"
  label: string;
  /** 반환: 파일 바이트와 확장자 */
  export(rows: LedgerRow[]): { data: Uint8Array; ext: "csv" | "xlsx" };
}
