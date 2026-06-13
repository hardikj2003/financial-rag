import { RetrievedChunk } from "./types/retrieval.types";

/**
 * Each source is wrapped in explicit delimiters so document content is
 * clearly data, not instructions — the first line of defense against
 * prompt injection via poisoned PDFs (see the system prompt's injection
 * rule, which references these markers).
 */
export const formatSourcesForPrompt = (chunks: RetrievedChunk[]) =>
  chunks
    .map(
      (chunk, index) => `<source id="${index + 1}" document="${chunk.documentName.replace(/"/g, "'")}">
${chunk.text}
</source>`,
    )
    .join("\n\n");
