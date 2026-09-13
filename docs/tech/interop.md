# 외부 파일 연동 (가져오기 · 내보내기)

패키지: `packages/interop` — 순수 변환 함수만. DB 저장은 `api`가 담당.
목적: **통장정리·카드·증권 내보내기 파일을 가져오고**, 회계·세무 프로그램이나 세무사에게 **전달할 파일을 내보낸다.**

## 가져오기 (Import)
| 대상 | 파일 | 파서 | 상태 |
|---|---|---|---|
| 은행 통장 거래내역 (공통) | CSV/XLSX/DOCX | `importers/generic-bank.ts` + `fileToRows`. 웹 `/accounts`·`/profile` 통장내역 → `profile.previewFile` 변환 미리보기 후 `transactions.commitImport` | 연결됨 |
| 고정비 세부내역 | CSV/XLSX/DOCX | `importers/recurring-costs.ts` — 헤더 이름·분류·금액·출금일·메모. 프로필대장 가져오기 → 변환 내용 표시 후 `recurringImport`. 같은 이름은 갱신. 내보내기 CSV·엑셀·워드 | 연결됨 |
| 은행별 전용 (카카오뱅크, 토스, 국민, 신한 …) | 각 은행 내보내기 | 은행별 파서 — 실제 파일 샘플 받아서 작성 | 미구현 |
| 카드 이용내역 | CSV/XLSX | 승인일·가맹점·금액·할부 | 미구현 |
| 증권사 체결내역 (한투, 키움 …) | CSV/XLSX | `TradeImporter` | 미구현 |
| 코인 거래소 (업비트) | CSV | `TradeImporter` | 미구현 |
| 홈택스 자료 (연말정산 간소화 PDF/XLSX, 카드·현금영수증) | PDF/XLSX | 3단계 | 미구현 |
| 급여대장 / 4대보험 고지 | XLSX | 4단계 | 미구현 |

흐름: 파일 업로드 → `fileToRows`(csv/`xlsxToRows`/`docxToRows`) → `detectTransactionImporter` 또는 고정비 헤더 → 변환 내용 표 → 사용자 확인 → 저장.
인코딩: 국내 은행 CSV는 EUC-KR인 경우가 많음 — 업로드 시 `TextDecoder("euc-kr")` 시도 후 깨지면 UTF-8.
워드: `.docx` 표만. 구형 `.doc`는 거절하고 docx로 저장하라고 안내.

## 내보내기 (Export)
| 대상 | 형식 | 상태 |
|---|---|---|
| 세무사 전달용 범용 장부 CSV | 일자·계정과목·차변·대변·적요·거래처·증빙 | 초안 (`exporters/generic-csv.ts`) |
| **더존** (Smart A / iCUBE) | 전표 엑셀 업로드 양식 — 실제 양식 파일 확보 후 작성 | 미구현 |
| **위하고** (WEHAGO) | 거래내역·전표 엑셀 업로드 양식 | 미구현 |
| **세무사랑** | 전표 엑셀 업로드 양식 | 미구현 |
| 연말정산 제출 자료 패키지 | 공제 항목 정리 XLSX | 3단계 |
| 급여명세·원천세 신고 자료 | XLSX | 4단계 |

각 프로그램의 업로드 양식은 버전마다 다르고 공개 스펙이 없으므로, **실제 양식 파일(빈 템플릿)을 받아서** `exporters/<program>.ts`에 컬럼 순서·헤더·날짜 형식을 그대로 맞춘다. 추측으로 만들지 않는다.

## 규칙
- 파서는 원본 행을 `raw`에 보존, 실패 행은 `skipped`에 사유와 줄 번호
- 금액은 항상 양수 + `direction`
- 새 파서 추가 시 실제 샘플 파일 1개 이상을 `packages/interop/fixtures/`(gitignore, 개인정보)에 두고 vitest로 검증
- 이 문서의 표 갱신
