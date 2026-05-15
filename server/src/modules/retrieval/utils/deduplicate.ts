import { RetrievedChunk } from "../types/retrieval.types";

export const deduplicateChunks = (chunks: RetrievedChunk[]) => {
  const seen = new Set<string>();

  return chunks.filter((chunk) => {
    const key = `${chunk.documentName}-${chunk.chunkIndex}`;

    if (seen.has(key)) {
      return false;
    }
    seen.add(key);

    return true;
  });
};
