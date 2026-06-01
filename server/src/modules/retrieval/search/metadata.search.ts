import qdrantClient from "../../qdrant/qdrant.client";
import { RetrievedChunk } from "../types/retrieval.types";

export const metadataSearch = async (
  sectionTitle: string,
): Promise<RetrievedChunk[]> => {
  const result = await qdrantClient.scroll("financial_docs", {
    limit: 100,
    with_payload: true,
    with_vector: false,
  });

  return result.points
    .filter((point: any) => {
      const section = (point.payload?.sectionTitle || "").toLowerCase();

      return section.includes(sectionTitle.toLowerCase());
    })
    .slice(0, 10)
    .map((point: any) => ({
      id: String(point.id),
      text: point.payload?.text || "",
      documentName: point.payload?.documentName,
      chunkIndex: point.payload?.chunkIndex,
      sectionTitle: point.payload?.sectionTitle,
      parentId: point.payload?.parentId,
      parentText: point.payload?.parentText,
      score: 30,
      metadata: point.payload || {},
      companyName: point.payload?.companyName,
    }));
};
