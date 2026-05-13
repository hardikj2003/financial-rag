import qdrantClient from "../qdrant/qdrant.client";
import { generateEmbedding } from "../../services/embedding.service";

export const retrieveRelevantChunks = async (query: string) => {
  const queryEmbeddings = await generateEmbedding(query);
  const searchResult = await qdrantClient.search("financial_docs", {
    vector: queryEmbeddings,
    limit: 5,
  });

  return searchResult;
};
