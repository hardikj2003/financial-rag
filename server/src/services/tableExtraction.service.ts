export interface ExtractedTable {
  tableName?: string;
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

export const extractTables = (text: string): ExtractedTable[] => {
  const lines = text.split("\n");
  const tables: ExtractedTable[] = [];
  let currentRows: string[][] = [];
  let currentTableName: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const cleaned = lines[i].trim();
    const lower = cleaned.toLowerCase();
    const looksTabular = /\d/.test(cleaned) && cleaned.split(/\s+/).length >= 3;
    
    // Detect possible table heading
    const detectedHeader = TABLE_HEADERS.find((header) =>
      lower.includes(header),
    );

    if (detectedHeader) {
      currentTableName = cleaned;
    }

    if (looksTabular) {
      currentRows.push(cleaned.split(/\s+/));
    } else {
      if (currentRows.length > 2) {
        tables.push({
          tableName: currentTableName || "Financial Table",

          rows: currentRows,
        });
      }
      currentRows = [];
    }
  }

  if (currentRows.length > 2) {
    tables.push({
      tableName: currentTableName || "Financial Table",

      rows: currentRows,
    });
  }

  return tables;
};
