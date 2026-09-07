export * from "./types";
export * from "./parse-file";
export { genericBankImporter } from "./importers/generic-bank";
import { genericBankImporter } from "./importers/generic-bank";
import { genericCsvExporter } from "./exporters/generic-csv";
import type { TransactionImporter, TradeImporter, LedgerExporter } from "./types";

// 등록 순서 = 감지 우선순위 (구체적인 것 먼저, 범용은 마지막)
export const transactionImporters: TransactionImporter[] = [genericBankImporter];
export const tradeImporters: TradeImporter[] = [];
export const ledgerExporters: LedgerExporter[] = [genericCsvExporter];

export function detectTransactionImporter(rows: string[][]) {
  const headers = rows.find((r) => r.length > 2) ?? [];
  return transactionImporters.find((i) => i.detect(headers, rows.slice(0, 5)));
}
