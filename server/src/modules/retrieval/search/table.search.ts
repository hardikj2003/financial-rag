import prisma from "../../../config/prisma";
import { RetrievedTable } from "../types/retrieval.types";

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 2);

/**
 * Query-aware table retrieval. The previous implementation ignored the query
 * entirely (`findMany take 20`, every table hardcoded to score 100), which
 * injected arbitrary — often wrong-company — tables above all text evidence.
 *
 * Tables are now scored by term overlap between the query and the table
 * name / source document / table contents, optionally restricted to the
 * company in conversation memory, and only returned when they actually match.
 */
export const tableSearch = async (
  query: string,
  company?: string,
): Promise<RetrievedTable[]> => {
  const tables = await prisma.financialTable.findMany({
    include: {
      document: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const queryTerms = new Set(tokenize(query));
  if (queryTerms.size === 0) return [];

  return tables
    .map((table) => {
      const haystack = [
        table.tableName ?? "",
        table.document.fileName,
        JSON.stringify(table.rawTable).slice(0, 2000),
      ]
        .join(" ")
        .toLowerCase();

      let overlap = 0;
      for (const term of queryTerms) {
        if (haystack.includes(term)) overlap++;
      }

      const companyMatch =
        company !== undefined && haystack.includes(company.toLowerCase());

      // When the conversation is about a known company, exclude tables that
      // show no relation to it instead of risking cross-company citations.
      if (company !== undefined && !companyMatch) {
        overlap = 0;
      }

      return {
        id: table.id,
        tableName: table.tableName || "Financial Table",
        rows: table.rawTable,
        score: overlap / queryTerms.size,
        documentId: table.documentId,
        documentName: table.document.fileName,
      };
    })
    .filter((table) => table.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

/**
 * Renders table rows as readable lines, truncated at row boundaries so the
 * LLM never receives a half-row. The previous version sliced raw JSON at a
 * fixed character offset, handing the model malformed "evidence".
 */
export const formatTableAsText = (rows: unknown, maxChars = 1200): string => {
  if (!Array.isArray(rows)) return "";

  const lines: string[] = [];
  let total = 0;

  for (const row of rows) {
    const line = Array.isArray(row) ? row.join(" | ") : String(row);

    if (total + line.length > maxChars) break;

    lines.push(line);
    total += line.length + 1;
  }

  return lines.join("\n");
};
