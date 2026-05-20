import { RetrievedChunk } from "./types/retrieval.types";

export const formatSourcesForPrompt = (chunks: RetrievedChunk[]) => {
  return chunks
    .map((chunk, index) => {
      return `
[Source ${index + 1}]
Document:
${chunk.documentName}
Section:
${chunk.sectionTitle}
Content:
${chunk.text}
`;
    })
    .join("\n\n");
};
