export interface MetricRecord {
  metricName: string;
  period: string;
  value: number;
  unit: string;
}

/**
 * Canonical metric mapping. Order matters: more specific patterns first
 * ("profit before tax" must not be swallowed by the generic profit rule).
 */
const METRIC_RULES: Array<[RegExp, string]> = [
  [/\bebitda\b/i, "EBITDA"],
  [/earnings per share|\beps\b/i, "EPS"],
  [/profit before tax|\bpbt\b/i, "Profit Before Tax"],
  [/net profit|profit after tax|\bpat\b|net income/i, "Net Profit"],
  [/operating profit|\bebit\b/i, "Operating Profit"],
  [
    /\brevenue\b|total income|income from operations|net sales|turnover/i,
    "Revenue",
  ],
  [/total assets/i, "Total Assets"],
  [/total liabilities/i, "Total Liabilities"],
];

const UNIT_MULTIPLIERS: Record<string, number> = {
  crore: 1e7,
  crores: 1e7,
  lakh: 1e5,
  lakhs: 1e5,
  million: 1e6,
  millions: 1e6,
  mn: 1e6,
  billion: 1e9,
  billions: 1e9,
  bn: 1e9,
  thousand: 1e3,
};

const PERIOD_PATTERNS: RegExp[] = [
  /\bQ[1-4]\s?FY\s?'?\d{2,4}\b/i, // Q1FY25
  /\bFY\s?'?\d{2,4}(?:-\d{2})?\b/i, // FY24, FY 2023-24
  /\bQ[1-4]\s?'?\d{2,4}\b/i, // Q1 2024
  /\b20\d{2}-\d{2,4}\b/, // 2023-24
  /\b20\d{2}\b/, // 2024
];

export const detectPeriod = (cell: string): string | null => {
  for (const pattern of PERIOD_PATTERNS) {
    const match = pattern.exec(cell);
    if (match) return match[0].replace(/\s+/g, "").toUpperCase();
  }
  return null;
};

/**
 * Parses a numeric cell: strips currency symbols and thousand separators,
 * treats accounting parentheses as negatives, ignores period-like values
 * (years must not be ingested as metric values).
 */
export const parseNumericCell = (cell: string): number | null => {
  if (detectPeriod(cell)) return null;

  const negative = /^\(.*\)$/.test(cell.trim());
  const cleaned = cell.replace(/[(),₹$%]|rs\.?/gi, "").trim();

  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;

  const value = Number(cleaned);
  return negative ? -value : value;
};

const matchMetric = (label: string): string | null => {
  for (const [pattern, name] of METRIC_RULES) {
    if (pattern.test(label)) return name;
  }
  return null;
};

/**
 * Structured metric extraction from table rows.
 *
 * The previous implementation labeled EVERY numeric row "Revenue" and read
 * row[0] as the period unconditionally — it populated the FinancialMetric
 * table with fabricated data. This version:
 *  1. Locates a header row mapping columns to periods (FY24, Q1FY25, 2024).
 *  2. Only extracts rows whose label matches a known financial metric.
 *  3. Normalizes values using the table's unit hint (crore/lakh/million...).
 */
export const extractFinancialMetrics = (
  rows: string[][],
  unitHint?: string,
): MetricRecord[] => {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  // 1. Find the column → period mapping from the first row containing
  //    at least two period-like cells.
  let periodByColumn = new Map<number, string>();

  for (const row of rows.slice(0, 3)) {
    const found = new Map<number, string>();
    row.forEach((cell, column) => {
      const period = detectPeriod(String(cell));
      if (period) found.set(column, period);
    });

    if (found.size >= 2) {
      periodByColumn = found;
      break;
    }
  }

  const multiplier = unitHint ? (UNIT_MULTIPLIERS[unitHint] ?? 1) : 1;
  const unit = unitHint ? `INR (${unitHint})` : "INR";

  const metrics: MetricRecord[] = [];

  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue;

    // The label is the leading run of non-numeric cells.
    const labelCells: string[] = [];
    for (const cell of row) {
      if (parseNumericCell(String(cell)) !== null) break;
      labelCells.push(String(cell));
    }

    const metricName = matchMetric(labelCells.join(" "));
    if (!metricName) continue;

    const isEPS = metricName === "EPS";

    row.forEach((cell, column) => {
      const value = parseNumericCell(String(cell));
      if (value === null) return;

      const period = periodByColumn.get(column) ?? "unspecified";

      metrics.push({
        metricName,
        period,
        // EPS is per-share and never scaled by table units.
        value: isEPS ? value : value * multiplier,
        unit: isEPS ? "INR/share" : unit,
      });
    });
  }

  return metrics;
};
