import qdrantClient from "../../qdrant/qdrant.client";
import { RetrievedChunk } from "../types/retrieval.types";
import { FINANCIAL_COLLECTION } from "../../qdrant/qdrant.service";
import { mapPointToChunk } from "./vector.search";

/**
 * Section-targeted retrieval using a native Qdrant payload filter (backed by
 * a payload index). The previous implementation scrolled 100 arbitrary points
 * and filtered in JavaScript, which both missed matches outside the first
 * page and wasted bandwidth on non-matches.
 */
export const metadataSearch = async (
  sectionTitle: string,
  company?: string,
  limit = 10,
): Promise<RetrievedChunk[]> => {
  const must: Array<Record<string, unknown>> = [
    { key: "sectionTitle", match: { value: sectionTitle } },
  ];

  if (company) {
    must.push({ key: "companyName", match: { value: company } });
  }

  const result = await qdrantClient.scroll(FINANCIAL_COLLECTION, {
    limit,
    with_payload: true,
    with_vector: false,
    filter: { must },
  });

  return result.points.map(mapPointToChunk);
};
