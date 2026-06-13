import { RetrievedChunk } from "../types/retrieval.types";

/**
 * Deduplicates by point id, keeping the highest-scored instance. The previous
 * documentName-chunkIndex key collapsed all retrieved tables into one because
 * they shared a placeholder name and index 0.
 */
export const deduplicateChunks = (chunks: RetrievedChunk[]) => {
  const seen = new Map<string, RetrievedChunk>();

  for (const chunk of chunks) {
    const existing = seen.get(chunk.id);

    if (!existing || chunk.score > existing.score) {
      seen.set(chunk.id, chunk);
    }
  }

  return Array.from(seen.values()).sort((a, b) => b.score - a.score);
};
