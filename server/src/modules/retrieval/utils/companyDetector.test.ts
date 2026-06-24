import { describe, it, expect } from "vitest";
import { detectCompany, detectCompanies } from "./companyDetector";

describe("detectCompanies", () => {
  it("detects SBI via aliases (regression: 'sbi' was not in the list)", () => {
    expect(detectCompanies("how is sbi doing")).toEqual(["sbi"]);
    expect(detectCompanies("state bank of india results")).toEqual(["sbi"]);
  });

  it("detects multiple companies in order of appearance", () => {
    expect(detectCompanies("compare reliance and sbi")).toEqual([
      "reliance",
      "sbi",
    ]);
    expect(detectCompanies("sbi versus reliance")).toEqual(["sbi", "reliance"]);
  });

  it("returns the earliest company for the singular helper", () => {
    expect(detectCompany("reliance and infosys")).toBe("reliance");
  });

  it("returns nothing when no known company is mentioned", () => {
    expect(detectCompanies("what is the weather")).toEqual([]);
    expect(detectCompany("what is the weather")).toBeUndefined();
  });
});
