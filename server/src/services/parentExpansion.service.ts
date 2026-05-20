import { RetrievedChunk } from "../modules/retrieval/types/retrieval.types";

export const expandToParentContexts = (
  chunks: RetrievedChunk[],
): RetrievedChunk[] => {
  const parentMap = new Map<string, RetrievedChunk>();

  for (const chunk of chunks) {
    const parentId = chunk.parentId;

    if (!parentId) continue;

    if (!parentMap.has(parentId)) {
      parentMap.set(parentId, {
        ...chunk,

        text: chunk.parentText || chunk.text,
      });
    }
  }

  return Array.from(parentMap.values());
};
