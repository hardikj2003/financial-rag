import prisma from "../../../config/prisma";
import { RetrievedTable } from "../types/retrieval.types";

export const tableSearch = async (query: string): Promise<RetrievedTable[]> => {
  const tables = await prisma.financialTable.findMany({
    include: {
      document: true,
    },
    take: 20,
  });
  console.log(
    "TABLES RETRIEVED:",
    tables.map((t) => ({
      file: t.document.fileName,
      table: t.tableName,
    })),
  );
  console.log(
    "DOCUMENT IDS:",
    tables.map((t) => t.documentId),
  );

  return tables.map((table) => ({
    id: table.id,
    tableName: table.tableName || "Financial Table",
    rows: table.rawTable,
    score: 100,
    documentId: table.documentId,
  }));
};
