export interface ExtractedTable {
  tableName: string;
  unitHint?: string;
  rows: string[][];
}

const TABLE_HEADERS = [
  "revenue",
  "income",
  "sales",
  "ebitda",
  "profit",
  "cash flow",
  "balance sheet",
  "assets",
  "liabilities",
  "equity",
  "financial highlights",
  "results of operations",
];

const UNIT_HINT_PATTERN =
  /(?:₹|rs\.?|inr)?\s*(?:in\s+)?(crores?|lakhs?|millions?|billions?|mn|bn)\b/i;

const MIN_TABLE_ROWS = 3;

/**
 * Splits a line into cells. Prefers runs of 2+ spaces (column gaps that
 * sometimes survive pdf-parse); falls back to single-space tokens.
 */
const splitCells = (line: string): string[] => {
  const wide = line.split(/\s{2,}/).filter(Boolean);
  return wide.length >= 2 ? wide : line.split(/\s+/).filter(Boolean);
};

/**
 * Line-oriented table detection over flattened PDF text. This is inherently
 * best-effort: pdf-parse discards layout, so column alignment is partially
 * lost. Rows now require at least two numeric tokens (the previous "one
 * digit anywhere" heuristic matched ordinary prose like "grew 11% over
 * three years"), and per-table unit hints are captured for downstream
 * normalization.
 */
export const extractTables = (text: string): ExtractedTable[] => {
  const lines = text.split("\n");
  const tables: ExtractedTable[] = [];

  let currentRows: string[][] = [];
  let currentTableName: string | undefined;
  let currentUnitHint: string | undefined;

  const flush = () => {
    if (currentRows.length >= MIN_TABLE_ROWS) {
      tables.push({
        tableName: currentTableName || "Financial Table",
        unitHint: currentUnitHint,
        rows: currentRows,
      });
    }
    currentRows = [];
  };

  for (const rawLine of lines) {
    const cleaned = rawLine.trim();
    const lower = cleaned.toLowerCase();

    const numericTokens = (cleaned.match(/\(?-?[\d,]+(?:\.\d+)?\)?%?/g) ?? [])
      .filter((token) => /\d/.test(token));
    const looksTabular =
      numericTokens.length >= 2 && splitCells(cleaned).length >= 3;

    if (TABLE_HEADERS.some((header) => lower.includes(header)) && !looksTabular) {
      currentTableName = cleaned;
    }

    const unitMatch = UNIT_HINT_PATTERN.exec(cleaned);
    if (unitMatch && !looksTabular) {
      currentUnitHint = unitMatch[1].toLowerCase();
    }

    if (looksTabular) {
      currentRows.push(splitCells(cleaned));
    } else {
      flush();
    }
  }

  flush();

  return tables;
};
