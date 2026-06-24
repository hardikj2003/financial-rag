import { vectorSearch } from "./vector.search";
import { keywordSearch } from "./keyword.search";
import { metadataSearch } from "./metadata.search";
import { tableSearch, formatTableAsText } from "./table.search";
import { reciprocalRankFusion } from "../utils/rrf";
import { applyMetadataBoost } from "../utils/metadataBoost";
import { QueryAnalysis } from "../utils/queryAnalyzer";
import { RetrievalMemory, RetrievedChunk } from "../types/retrieval.types";
import { logger } from "../../../config/logger";
import { QueryTracer } from "../../../services/tracing/queryTracer";

const CANDIDATES_PER_QUERY = 24;

/**
 * Candidate generation for one search query:
 * dense + lexical (+ section filter + tables when intent calls for them)
 * → RRF fusion → metadata/memory boosts.
 *
 * Deduplication, reranking and parent expansion happen exactly once, at the
 * end of the full pipeline in retrieval.service — not here. Running them per
 * sub-query (as before) reranked on incomparable scores and expanded parents
 * before the final ranking was known.
 */
export const hybridSearch = async (
  query: string,
  analysis: QueryAnalysis,
  memory?: RetrievalMemory,
  tracer?: QueryTracer,
): Promise<RetrievedChunk[]> => {
  const company = memory?.currentCompany;

  const [vectorResults, keywordResults, metadataResults, tableResults] =
    await Promise.all([
      vectorSearch(query, company),
      keywordSearch(query, company),
      analysis.sectionIntent
        ? metadataSearch(analysis.sectionIntent, company)
        : Promise.resolve([]),
      analysis.wantsTables
        ? tableSearch(query, company)
        : Promise.resolve([]),
    ]);

  const tableChunks: RetrievedChunk[] = tableResults.map((table, index) => ({
    id: `table-${table.id}`,
    documentId: table.documentId,
    text: `${table.tableName}\n${formatTableAsText(table.rows)}`,
    score: table.score,
    documentName: table.documentName,
    chunkIndex: index,
    sectionTitle: table.tableName,
  }));

  logger.debug("hybrid search candidates", {
    query,
    vector: vectorResults.length,
    keyword: keywordResults.length,
    metadata: metadataResults.length,
    tables: tableChunks.length,
  });

  const fused = reciprocalRankFusion([
    vectorResults,
    keywordResults,
    metadataResults,
    tableChunks,
  ]);

  const boosted = applyMetadataBoost(analysis, fused, memory).slice(
    0,
    CANDIDATES_PER_QUERY,
  );

  if (tracer) {
    tracer.recordRetriever({ retriever: "vector", searchQuery: query, company, results: vectorResults });
    tracer.recordRetriever({ retriever: "keyword", searchQuery: query, company, results: keywordResults });
    if (metadataResults.length)
      tracer.recordRetriever({ retriever: "metadata", searchQuery: query, company, results: metadataResults });
    if (tableChunks.length)
      tracer.recordRetriever({ retriever: "table", searchQuery: query, company, results: tableChunks });
    tracer.recordFusion(
      [...vectorResults, ...keywordResults, ...metadataResults, ...tableChunks],
      boosted,
    );
  }

  return boosted;
};
