import { RetrievedChunk } from "./types/retrieval.types";

// Context budget. Groq's free tier caps tokens-per-minute (≈12k), and the
// request size = input + reserved output. Unbounded context (8 chunks with
// parent expansion can reach ~44k chars ≈ 11k tokens) blows that limit and
// triggers a 413. At ~4 chars/token these caps keep context near ~5k tokens.
const MAX_CHARS_PER_SOURCE = Number(process.env.MAX_CHARS_PER_SOURCE ?? 1600);
const MAX_CONTEXT_CHARS = Number(process.env.MAX_CONTEXT_CHARS ?? 20000);

/** Trims at a sentence/word boundary near the limit instead of mid-word. */
const trimChunk = (text: string, limit: number) => {
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit);
  const lastStop = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("\n"));
  return (lastStop > limit * 0.5 ? slice.slice(0, lastStop + 1) : slice).trim() + " …";
};

/**
 * Each source is wrapped in explicit delimiters so document content is clearly
 * data, not instructions — the first line of defense against prompt injection
 * via poisoned PDFs (see the system prompt's injection rule).
 *
 * Sources are trimmed per-source and the total context is capped, dropping the
 * lowest-ranked sources if the budget is exhausted (chunks arrive ranked).
 */
export const formatSourcesForPrompt = (chunks: RetrievedChunk[]) => {
  const blocks: string[] = [];
  let used = 0;
  let index = 0;

  for (const chunk of chunks) {
    if (used >= MAX_CONTEXT_CHARS) break;

    const remaining = MAX_CONTEXT_CHARS - used;
    const text = trimChunk(chunk.text, Math.min(MAX_CHARS_PER_SOURCE, remaining));
    if (!text.trim()) continue;

    index += 1;
    const doc = chunk.documentName.replace(/"/g, "'");
    blocks.push(`<source id="${index}" document="${doc}">\n${text}\n</source>`);
    used += text.length;
  }

  return blocks.join("\n\n");
};
