import qdrantClient from "../../qdrant/qdrant.client";
import { generateQueryEmbedding } from "../../../services/embedding.service";
import { RetrievedChunk } from "../types/retrieval.types";
import { FINANCIAL_COLLECTION } from "../../qdrant/qdrant.service";

export const mapPointToChunk = (point: {
  id: string | number;
  score?: number;
  payload?: Record<string, unknown> | null;
}): RetrievedChunk => ({
  id: String(point.id),
  documentId: String(point.payload?.documentId ?? ""),
  text: String(point.payload?.text ?? ""),
  documentName: String(point.payload?.documentName ?? "Financial Report"),
  chunkIndex: Number(point.payload?.chunkIndex ?? 0),
  sectionTitle: String(point.payload?.sectionTitle ?? "general"),
  parentId: String(point.payload?.parentId ?? ""),
  parentText: String(point.payload?.parentText ?? ""),
  score: Number(point.score ?? 0),
  companyName: point.payload?.companyName
    ? String(point.payload.companyName)
    : undefined,
});

/**
 * Dense retrieval. When the company is known from conversation memory we
 * filter natively in Qdrant instead of post-hoc boosting: a boost cannot
 * recover chunks that never made the candidate list.
 */
export const vectorSearch = async (
  query: string,
  company?: string,
  limit = 20,
): Promise<RetrievedChunk[]> => {
  const embedding = await generateQueryEmbedding(query);

  const results = await qdrantClient.search(FINANCIAL_COLLECTION, {
    vector: embedding,
    limit,
    filter: company
      ? {
          must: [{ key: "companyName", match: { value: company } }],
        }
      : undefined,
  });

  return results.map(mapPointToChunk);
};
