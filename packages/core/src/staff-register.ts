// 직원 명부 뒤 건강보험 직장가입자 자격취득. 공단 전송·보험료 곱셈이 아님.

import { formCsv, slotCsvCell, type SlotWon } from "./form-csv";

export const STAFF_REGISTER = {
  form: "근로자 명부",
  basis: "근로기준법 제41조. 시행령 제20조. 시행규칙 별지 제16호서식",
  plain: "사업장마다 직원 이름·생년월일·하는 일·고용일을 적는 명부",
  except: "사용기간 30일 미만 일용은 명부를 작성하지 않을 수 있음(시행령 제21조)",
} as const;

export const STAFF_REGISTER_COLUMNS = [
  { id: "name", label: "성명", plain: "이름", decree: "시행령 제20조 제1호" },
  { id: "sex", label: "성별", plain: "남·여", decree: "제2호" },
  { id: "birth", label: "생년월일", plain: "태어난 날", decree: "제3호" },
  { id: "address", label: "주소", plain: "사는 곳", decree: "제4호" },
  { id: "phone", label: "전화번호", plain: "연락처", decree: "제4호" },
  { id: "job", label: "종사 업무", plain: "무슨 일", decree: "제6호" },
  { id: "hired", label: "고용일", plain: "들어온 날", decree: "제7호" },
  { id: "contractEnd", label: "계약기간", plain: "끝날 날. 없으면 칸", decree: "제7호" },
  { id: "history", label: "이력", plain: "경력·학력 등", decree: "제5호" },
  { id: "left", label: "퇴직·해고일", plain: "나간 날. 없으면 칸", decree: "제8호" },
  { id: "leftReason", label: "퇴직·해고 사유", plain: "왜 나갔는지", decree: "제8호" },
  { id: "extra", label: "그 밖에 필요한 사항", plain: "더 적을 것", decree: "제9호" },
] as const;

/** 국민건강보험법 시행규칙 별지 제6호서식. 4대보험 공통 서식에서 건강보험을 이어 적음. */
export const NHI_ACQUISITION = {
  form: "건강보험 직장가입자 자격취득 신고서",
  basis: "국민건강보험법 제6조 제2항·제8조 제2항. 시행규칙 제4조 제2항 별지 제6호서식",
  plain: "직원을 쓰면 그 날부터 14일 안에 공단에 직장가입자로 알리는 신고. 보험료를 여기서 곱하지 않음",
  due: "자격 취득한 날부터 14일 이내",
  except: "고용 기간이 1개월 미만인 일용근로자는 직장가입자가 아님(제6조 제2항 제1호)",
  not: "공단 EDI·4대보험 연계센터 전송이 아님. 피부양자 제5쪽 칸은 만들지 않음",
} as const;

/** 자격취득 Open API는 없음. 로그인·공동인증서 창구만. */
export const NHI_OFFICIAL_LINKS = [
  { id: "nhis", label: "국민건강보험공단", url: "https://www.nhis.or.kr", plain: "공단 홈" },
  { id: "edi", label: "건강보험 EDI", url: "https://edi.nhis.or.kr/", plain: "사업장 전자신고. 이 칸을 넣지 않음" },
  { id: "four", label: "4대사회보험 정보연계센터", url: "https://www.4insure.or.kr/", plain: "자격취득신고. 공동인증서" },
] as const;

/** 지금 화면에서 보이는 흐름. 공단 접수가 아님. */
export const NHI_HANDOFF_STEPS = [
  { id: "register", label: "근로자 명부", plain: "이름·고용일을 적음" },
  { id: "acquire", label: "자격취득 칸", plain: "고용일이 자격취득일을 채움. 보험료를 곱하지 않음" },
  { id: "csv", label: "시산 CSV", plain: "이 기기. 공단 제출 파일이 아님" },
  { id: "venue", label: "공식 창구", plain: "공단 홈·EDI·연계센터에서 로그인 후 직접 적음" },
] as const;

/** 나중에 실제 양식·공개 API가 오면 여기만 채운다. 지금은 엔드포인트·엑셀 컬럼을 만들지 않음. */
export const NHI_LATER = {
  ready: false,
  ediTemplate: "건강보험 EDI 빈 엑셀 일괄신고 양식이 오면 그 컬럼 그대로. 추측하지 않음",
  openApi: "자격취득 Open API가 공개되면 그때 붙임. 지금은 호출을 만들지 않음",
} as const;

export const NHI_ACQUISITION_COLUMNS = [
  { id: "name", label: "성명", plain: "이름" },
  { id: "idNo", label: "주민등록번호", plain: "비워도 됨. 넣어도 이 기기 CSV만" },
  { id: "wage", label: "월 소득액(보수월액)", plain: "월급. 보험료를 곱하지 않음" },
  { id: "nhiAcquired", label: "자격취득일", plain: "채용일. 비우면 고용일을 씀" },
  { id: "nhi", label: "건강보험", plain: "취득 여부" },
  { id: "dependents", label: "피부양자 신청", plain: "있으면 제5쪽. 이 화면은 표시만" },
] as const;

export type StaffLine = {
  id: string;
  name: string;
  sex: string;
  birth: string;
  address: string;
  phone: string;
  job: string;
  hired: string;
  contractEnd: string;
  history: string;
  left: string;
  leftReason: string;
  extra: string;
  wage: SlotWon;
  idNo: string;
  nhiAcquired: string;
  nhi: boolean;
  dependents: boolean;
};

export type WorkplaceNhiHead = {
  managementNo: string;
  workplaceName: string;
  workplaceAddress: string;
};

export function emptyWorkplaceNhiHead(): WorkplaceNhiHead {
  return { managementNo: "", workplaceName: "", workplaceAddress: "" };
}

export function emptyStaffLine(id: string): StaffLine {
  return {
    id,
    name: "",
    sex: "",
    birth: "",
    address: "",
    phone: "",
    job: "",
    hired: "",
    contractEnd: "",
    history: "",
    left: "",
    leftReason: "",
    extra: "",
    wage: null,
    idNo: "",
    nhiAcquired: "",
    nhi: false,
    dependents: false,
  };
}

export function emptyStaffLines(n: number): StaffLine[] {
  return Array.from({ length: n }, (_, i) => emptyStaffLine(`st${i + 1}`));
}

/** 화면 예시. 주민등록번호·사업장관리번호·월급은 비움. 실제 사람이 아님. */
export function exampleWorkplaceNhiHead(): WorkplaceNhiHead {
  return { managementNo: "", workplaceName: "예시사업장", workplaceAddress: "" };
}

export function exampleStaffLine(id = "st1"): StaffLine {
  return {
    ...emptyStaffLine(id),
    name: "홍길동",
    sex: "남",
    birth: "1990-01-01",
    job: "사무",
    hired: "2026-09-01",
    nhi: true,
  };
}

export function exampleStaffDesk(): { head: WorkplaceNhiHead; lines: StaffLine[] } {
  return {
    head: exampleWorkplaceNhiHead(),
    lines: [exampleStaffLine("st1"), emptyStaffLine("st2"), emptyStaffLine("st3")],
  };
}

/** 지금은 공식 링크와 시산 CSV만. 나중에 NHI_LATER를 채운다. */
export function nhiHandoff(head: WorkplaceNhiHead, lines: StaffLine[]) {
  return {
    kind: "official-links" as const,
    later: NHI_LATER,
    links: NHI_OFFICIAL_LINKS,
    csv: nhiAcquisitionCsv(head, lines),
  };
}

/** 자격취득일은 따로 적은 날, 없으면 고용일. */
export function nhiAcquisitionDate(line: StaffLine): string {
  const own = line.nhiAcquired.trim();
  if (own) return own;
  return line.hired.trim();
}

function filledRegister(l: StaffLine) {
  return Boolean(
    l.name
    || l.sex
    || l.birth
    || l.address
    || l.phone
    || l.job
    || l.hired
    || l.contractEnd
    || l.history
    || l.left
    || l.leftReason
    || l.extra,
  );
}

function filledNhi(l: StaffLine) {
  return Boolean(l.name || l.idNo || l.wage != null || nhiAcquisitionDate(l) || l.nhi || l.dependents);
}

export function staffRegisterCsv(lines: StaffLine[]): string {
  return formCsv(
    { form: STAFF_REGISTER.form, basis: STAFF_REGISTER.basis, plain: STAFF_REGISTER.plain },
    STAFF_REGISTER_COLUMNS.map((c) => c.label),
    lines.filter(filledRegister).map((l) => [
      l.name,
      l.sex,
      l.birth,
      l.address,
      l.phone,
      l.job,
      l.hired,
      l.contractEnd,
      l.history,
      l.left,
      l.leftReason,
      l.extra,
    ]),
  );
}

export function nhiAcquisitionCsv(head: WorkplaceNhiHead, lines: StaffLine[]): string {
  return formCsv(
    { form: NHI_ACQUISITION.form, basis: NHI_ACQUISITION.basis, plain: NHI_ACQUISITION.plain },
    ["사업장관리번호", "사업장 명칭", "소재지", ...NHI_ACQUISITION_COLUMNS.map((c) => c.label)],
    lines.filter(filledNhi).map((l) => [
      head.managementNo,
      head.workplaceName,
      head.workplaceAddress,
      l.name,
      l.idNo,
      slotCsvCell(l.wage),
      nhiAcquisitionDate(l),
      l.nhi ? "Y" : "",
      l.dependents ? "Y" : "",
    ]),
  );
}
