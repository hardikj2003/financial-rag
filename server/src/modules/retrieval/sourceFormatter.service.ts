import { RetrievedChunk } from "./types/retrieval.types";

export const formatSourcesForPrompt = (chunks: RetrievedChunk[]) => {
  return chunks
    .map(
      (chunk, index) => `
[Source ${index + 1}]
Document:
${chunk.documentName}

Content:
${chunk.text}
`,
    )
    .join("\n\n");
};
