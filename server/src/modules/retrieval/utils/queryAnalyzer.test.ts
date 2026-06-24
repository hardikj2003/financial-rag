import { describe, it, expect } from "vitest";
import { analyzeQuery } from "./queryAnalyzer";

describe("analyzeQuery", () => {
  it("classifies comparisons", () => {
    expect(analyzeQuery("compare Infosys and TCS revenue").type).toBe(
      "COMPARISON",
    );
    expect(analyzeQuery("Infosys vs TCS margins").type).toBe("COMPARISON");
  });

  it("classifies summaries", () => {
    expect(analyzeQuery("summarize the annual report").type).toBe("SUMMARY");
  });

  it("classifies fact lookups", () => {
    expect(analyzeQuery("what is the FY24 revenue").type).toBe("FACT_LOOKUP");
    expect(analyzeQuery("how much debt does reliance have").type).toBe(
      "FACT_LOOKUP",
    );
  });

  it("defaults to analysis", () => {
    expect(analyzeQuery("reliance capital allocation strategy").type).toBe(
      "ANALYSIS",
    );
  });

  it("detects section intent", () => {
    expect(analyzeQuery("what are the main risks").sectionIntent).toBe(
      "risk factors",
    );
    expect(analyzeQuery("free cash flow this year").sectionIntent).toBe(
      "cash flow",
    );
  });

  it("detects table and calculation intent", () => {
    const analysis = analyzeQuery("revenue growth percentage year over year");

    expect(analysis.wantsTables).toBe(true);
    expect(analysis.needsCalculations).toBe(true);
  });

  it("returns no section intent for generic queries", () => {
    expect(analyzeQuery("tell me about the company").sectionIntent).toBeNull();
  });

  it("treats 2+ companies as a comparison even without a keyword", () => {
    const a = analyzeQuery(
      "if i have to choose between reliance and sbi to invest, which one?",
    );
    expect(a.type).toBe("COMPARISON");
    expect(a.companies).toEqual(["reliance", "sbi"]);
  });

  it("flags investment/advice intent", () => {
    expect(analyzeQuery("should i invest in reliance or sbi").isAdvice).toBe(
      true,
    );
    expect(analyzeQuery("what was reliance revenue").isAdvice).toBe(false);
  });
});
