import { describe, expect, it } from "vitest";
import {
  NHI_ACQUISITION,
  NHI_HANDOFF_STEPS,
  NHI_LATER,
  NHI_OFFICIAL_LINKS,
  STAFF_REGISTER,
  STAFF_REGISTER_COLUMNS,
  emptyStaffLines,
  emptyWorkplaceNhiHead,
  exampleStaffDesk,
  exampleStaffLine,
  nhiAcquisitionCsv,
  nhiAcquisitionDate,
  nhiHandoff,
  staffRegisterCsv,
} from "./staff-register";

describe("staff register", () => {
  it("명부는 근로기준법 제41조·시행령 제20조 칸이다", () => {
    expect(STAFF_REGISTER.basis).toMatch(/근로기준법 제41조/);
    expect(STAFF_REGISTER.form).toBe("근로자 명부");
    expect(STAFF_REGISTER_COLUMNS.map((c) => c.label)).toEqual([
      "성명",
      "성별",
      "생년월일",
      "주소",
      "전화번호",
      "종사 업무",
      "고용일",
      "계약기간",
      "이력",
      "퇴직·해고일",
      "퇴직·해고 사유",
      "그 밖에 필요한 사항",
    ]);
    expect(STAFF_REGISTER.except).toMatch(/30일 미만/);
  });

  it("건강보험은 제8조 제2항 14일과 별지 제6호서식이다", () => {
    expect(NHI_ACQUISITION.form).toBe("건강보험 직장가입자 자격취득 신고서");
    expect(NHI_ACQUISITION.basis).toMatch(/제8조 제2항/);
    expect(NHI_ACQUISITION.basis).toMatch(/별지 제6호서식/);
    expect(NHI_ACQUISITION.due).toMatch(/14일/);
    expect(NHI_ACQUISITION.except).toMatch(/1개월 미만/);
    expect(NHI_ACQUISITION.plain).toMatch(/곱하지 않음/);
  });

  it("공식 창구는 공단·EDI·연계센터 링크만이다", () => {
    expect(NHI_OFFICIAL_LINKS.map((l) => l.id)).toEqual(["nhis", "edi", "four"]);
    expect(NHI_OFFICIAL_LINKS.every((l) => l.url.startsWith("https://"))).toBe(true);
  });

  it("예시는 명부에서 공식 창구로 이어지고 주민번호·월급은 비운다", () => {
    const sample = exampleStaffLine();
    expect(sample.name).toBe("홍길동");
    expect(sample.hired).toBe("2026-09-01");
    expect(sample.nhi).toBe(true);
    expect(sample.idNo).toBe("");
    expect(sample.wage).toBeNull();
    expect(nhiAcquisitionDate(sample)).toBe("2026-09-01");
    expect(NHI_HANDOFF_STEPS.map((s) => s.id)).toEqual(["register", "acquire", "csv", "venue"]);
    expect(NHI_LATER.ready).toBe(false);

    const desk = exampleStaffDesk();
    const handoff = nhiHandoff(desk.head, desk.lines);
    expect(handoff.kind).toBe("official-links");
    expect(handoff.csv).toMatch(/홍길동,,/);
    expect(handoff.csv).not.toMatch(/홍길동,,0/);
    expect(handoff.links).toHaveLength(3);
  });

  it("자격취득일이 비면 고용일을 쓴다", () => {
    const lines = emptyStaffLines(1);
    const first = lines[0];
    if (!first) throw new Error("row");
    first.hired = "2026-09-01";
    expect(nhiAcquisitionDate(first)).toBe("2026-09-01");
    first.nhiAcquired = "2026-09-02";
    expect(nhiAcquisitionDate(first)).toBe("2026-09-02");
  });

  it("시산 CSV는 빈 칸을 0으로 안 채운다", () => {
    const lines = emptyStaffLines(2);
    const first = lines[0];
    if (!first) throw new Error("row");
    first.name = "홍길동";
    first.hired = "2026-09-01";
    const register = staffRegisterCsv(lines);
    expect(register).toMatch(/근로자 명부/);
    expect(register).toMatch(/홍길동/);
    expect(register.split("\n").filter((l) => l.includes("홍길동")).length).toBe(1);

    first.wage = null;
    first.nhi = true;
    const nhi = nhiAcquisitionCsv(emptyWorkplaceNhiHead(), lines);
    expect(nhi).toMatch(/별지 제6호서식/);
    expect(nhi).toMatch(/홍길동,,/);
    expect(nhi).not.toMatch(/홍길동,,0/);
  });
});
