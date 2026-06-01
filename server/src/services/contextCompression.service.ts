import { RetrievedChunk } from "../modules/retrieval/types/retrieval.types";

export const compressContext = (query: string, chunks: RetrievedChunk[]) => {
  const queryTerms = query.toLowerCase().split(/\s+/);

  return chunks.map((chunk) => {
    const sentences = chunk.text.split(". ");

    const relevant = sentences.filter((sentence) =>
      queryTerms.some((term) => sentence.toLowerCase().includes(term)),
    );

    return {
      ...chunk,

      text: (relevant.length ? relevant.join(". ") : chunk.text).slice(0, 600),
    };
  });
};
