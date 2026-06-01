export interface ExtractedTable {
  tableName?: string;
  rows: string[][];
}

export const extractTables = (text: string): ExtractedTable[] => {
  const lines = text.split("\n");
  const tables: ExtractedTable[] = [];
  let current: string[][] = [];

  for (const line of lines) {
    const cleaned = line.trim();
    const looksTabular = /\d/.test(cleaned) && cleaned.split(/\s+/).length >= 3;

    if (looksTabular) {
      current.push(cleaned.split(/\s+/));
    } else {
      if (current.length > 2) {
        tables.push({
          rows: current,
        });
      }
      current = [];
    }
  }
  return tables;
};
