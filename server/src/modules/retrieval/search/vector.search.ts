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

  return results.map((result: any) => ({
    id: result.id,
    text: result.payload?.text || "",
    documentName: result.payload?.documentName || "Financial Report",
    chunkIndex: result.payload?.chunkIndex || 0,
    score: result.score || 0,
    metadata: result.payload || {},
  }));
};
