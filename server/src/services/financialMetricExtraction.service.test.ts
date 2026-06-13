import { describe, it, expect } from "vitest";
import {
  extractFinancialMetrics,
  parseNumericCell,
  detectPeriod,
} from "./financialMetricExtraction.service";

describe("detectPeriod", () => {
  it("detects fiscal years and quarters", () => {
    expect(detectPeriod("FY24")).toBe("FY24");
    expect(detectPeriod("Q1FY25")).toBe("Q1FY25");
    expect(detectPeriod("2023-24")).toBe("2023-24");
    expect(detectPeriod("2024")).toBe("2024");
    expect(detectPeriod("Revenue")).toBeNull();
  });
});

describe("parseNumericCell", () => {
  it("parses plain and comma-separated numbers", () => {
    expect(parseNumericCell("1,234.5")).toBe(1234.5);
  });

  it("treats accounting parentheses as negative", () => {
    expect(parseNumericCell("(500)")).toBe(-500);
  });

  it("rejects year-like cells (years are periods, not values)", () => {
    expect(parseNumericCell("2024")).toBeNull();
  });

  it("rejects non-numeric labels", () => {
    expect(parseNumericCell("Revenue")).toBeNull();
  });
});

describe("extractFinancialMetrics", () => {
  const rows = [
    ["Particulars", "FY24", "FY23"],
    ["Total Revenue", "9,000", "8,000"],
    ["EBITDA", "1,500", "1,200"],
    ["Net Profit", "(200)", "300"],
    ["Random narrative row", "12", "34"],
  ];

  it("maps columns to periods from the header row", () => {
    const metrics = extractFinancialMetrics(rows);

    const revenueFY24 = metrics.find(
      (m) => m.metricName === "Revenue" && m.period === "FY24",
    );

    expect(revenueFY24).toBeDefined();
    expect(revenueFY24!.value).toBe(9000);
  });

  it("only extracts rows matching known metrics (regression: everything was 'Revenue')", () => {
    const metrics = extractFinancialMetrics(rows);

    expect(metrics.some((m) => m.metricName === "EBITDA")).toBe(true);
    expect(metrics.every((m) => m.metricName !== "Random narrative row")).toBe(
      true,
    );
    // 3 metric rows × 2 period columns
    expect(metrics).toHaveLength(6);
  });

  it("normalizes units via the table unit hint", () => {
    const metrics = extractFinancialMetrics(rows, "crore");

    const revenue = metrics.find(
      (m) => m.metricName === "Revenue" && m.period === "FY24",
    )!;

    expect(revenue.value).toBe(9000 * 1e7);
    expect(revenue.unit).toBe("INR (crore)");
  });

  it("keeps negatives negative", () => {
    const metrics = extractFinancialMetrics(rows);
    const loss = metrics.find(
      (m) => m.metricName === "Net Profit" && m.period === "FY24",
    )!;

    expect(loss.value).toBe(-200);
  });

  it("never scales EPS by table units", () => {
    const epsRows = [
      ["Particulars", "FY24"],
      ["Earnings Per Share", "45.2"],
    ];

    const metrics = extractFinancialMetrics(epsRows, "crore");

    expect(metrics[0].metricName).toBe("EPS");
    expect(metrics[0].value).toBe(45.2);
    expect(metrics[0].unit).toBe("INR/share");
  });
});
