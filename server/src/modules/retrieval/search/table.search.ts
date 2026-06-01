import prisma from "../../../config/prisma";
import { RetrievedTable } from "../types/retrieval.types";

export const tableSearch = async (query: string): Promise<RetrievedTable[]> => {
  const tables = await prisma.financialTable.findMany({
    take: 5,
  });

  return tables.map((table) => ({
    id: table.id,
    tableName: table.tableName || "Financial Table",
    rows: table.rawTable,
    score: 100,
    documentId: table.documentId,
  }));
};
