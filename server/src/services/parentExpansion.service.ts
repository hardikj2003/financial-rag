import { RetrievedChunk } from "../modules/retrieval/types/retrieval.types";

const PARENT_CONTEXT_LIMIT = 1200;

/**
 * Expands final chunks with their parent-section context, deduplicating
 * parents so the same section text is not repeated across siblings in the
 * prompt. Truncation lands on a sentence boundary where possible.
 */
export const expandToParentContexts = (
  chunks: RetrievedChunk[],
): RetrievedChunk[] => {
  const seenParents = new Set<string>();

  return chunks.map((chunk) => {
    if (!chunk.parentText || !chunk.parentId) {
      return chunk;
    }

    if (seenParents.has(chunk.parentId)) {
      return chunk;
    }
    seenParents.add(chunk.parentId);

    let parent = chunk.parentText.slice(0, PARENT_CONTEXT_LIMIT);
    const lastSentenceEnd = parent.lastIndexOf(". ");
    if (lastSentenceEnd > PARENT_CONTEXT_LIMIT / 2) {
      parent = parent.slice(0, lastSentenceEnd + 1);
    }

    return {
      ...chunk,
      text: `${chunk.text}\n\nSection context:\n${parent}`,
    };
  });
};
