import qdrantClient from "../../qdrant/qdrant.client";
import { RetrievedChunk } from "../types/retrieval.types";
import { FINANCIAL_COLLECTION } from "../../qdrant/qdrant.service";
import { mapPointToChunk } from "./vector.search";
import { logger } from "../../../config/logger";

const SCROLL_PAGE_SIZE = 256;

/**
 * Hard ceiling on scanned points. Lexical search by scrolling is inherently
 * O(corpus); this keeps latency bounded while logging when the cap is hit so
 * degraded recall is visible instead of silent. The long-term replacement is
 * Qdrant sparse vectors (BM25/SPLADE) or Postgres full-text search.
 */
const MAX_SCANNED_POINTS = 5000;

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 1);

/**
 * BM25-style lexical scoring. The previous implementation scanned only the
 * first 200 points Qdrant happened to return (silently ignoring the rest of
 * the corpus) and scored by raw term counts with no IDF or length
 * normalization.
 */
export const keywordSearch = async (
  query: string,
  company?: string,
  limit = 20,
): Promise<RetrievedChunk[]> => {
  const queryTerms = Array.from(new Set(tokenize(query)));
  if (queryTerms.length === 0) return [];

  const filter = company
    ? { must: [{ key: "companyName", match: { value: company } }] }
    : undefined;

  type ScannedDoc = { chunk: RetrievedChunk; termFreqs: Map<string, number>; length: number };

  const docs: ScannedDoc[] = [];
  const docFreq = new Map<string, number>();
  let totalLength = 0;
  let offset: string | number | undefined | null = undefined;

  // Paginate through the corpus instead of reading a single page.
  while (docs.length < MAX_SCANNED_POINTS) {
    const page = await qdrantClient.scroll(FINANCIAL_COLLECTION, {
      limit: SCROLL_PAGE_SIZE,
      offset: offset ?? undefined,
      with_payload: true,
      with_vector: false,
      filter,
    });

    for (const point of page.points) {
      const chunk = mapPointToChunk(point);
      const tokens = tokenize(chunk.text);

      const termFreqs = new Map<string, number>();
      for (const term of queryTerms) {
        const tf = tokens.filter((t) => t === term).length;
        if (tf > 0) termFreqs.set(term, tf);
      }

      for (const term of termFreqs.keys()) {
        docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
      }

      totalLength += tokens.length;
      docs.push({ chunk, termFreqs, length: tokens.length });
    }

    offset = page.next_page_offset as typeof offset;
    if (!offset) break;
  }

  if (offset) {
    logger.warn("keyword search scan cap reached; recall may be degraded", {
      scanned: docs.length,
      cap: MAX_SCANNED_POINTS,
    });
  }

  if (docs.length === 0) return [];

  const avgLength = totalLength / docs.length || 1;
  const k1 = 1.2;
  const b = 0.75;

  return docs
    .map(({ chunk, termFreqs, length }) => {
      let score = 0;

      for (const [term, tf] of termFreqs) {
        const df = docFreq.get(term) ?? 0;
        const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
        const norm = tf / (tf + k1 * (1 - b + (b * length) / avgLength));
        score += idf * norm;
      }

      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, limit);
};
