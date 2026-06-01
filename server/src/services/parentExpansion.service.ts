import { RetrievedChunk } from "../modules/retrieval/types/retrieval.types";

export const expandToParentContexts = (
  chunks: RetrievedChunk[],
): RetrievedChunk[] => {
  return chunks.map((chunk) => ({
    ...chunk,

    text: chunk.parentText
      ? `${chunk.text}

Parent Context:
${chunk.parentText.slice(0, 400)}`
      : chunk.text,
  }));
};
