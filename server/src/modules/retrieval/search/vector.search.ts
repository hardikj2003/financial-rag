import qdrantClient from "../../qdrant/qdrant.client";
import { generateEmbedding } from "../../../services/embedding.service";
import { RetrievedChunk } from "../types/retrieval.types";

export const vectorSearch = async (
  query: string,
): Promise<RetrievedChunk[]> => {
  const embedding = await generateEmbedding(query);
  const results = await qdrantClient.search("financial_docs", {
    vector: embedding,
    limit: 6,
  });

  return results.map((point) => ({
    id: String(point.id),
    documentId: String(point.payload?.documentId || ""),
    text: String(point.payload?.text || ""),
    documentName: String(point.payload?.documentName || "Financial Report"),
    chunkIndex: Number(point.payload?.chunkIndex || 0),
    sectionTitle: String(point.payload?.sectionTitle || "general"),
    parentId: String(point.payload?.parentId || ""),
    parentText: String(point.payload?.parentText || ""),
    score: Number(point.score || 0),
    metadata: (point.payload as Record<string, unknown>) || {},
    companyName: String(point.payload?.companyName || ""),
  }));
};
