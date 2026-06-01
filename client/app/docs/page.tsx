"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Database,
  FileText,
  Gauge,
  GitBranch,
  Layers3,
  LineChart,
  MessageSquareText,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
  Zap,
} from "lucide-react";

type TabKey = "pipeline" | "concepts" | "tradeoffs" | "improvements";

type Stage = {
  id: string;
  title: string;
  subtitle: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  color: string;
  location: string;
  purpose: string;
  whyBuilt: string;
  role: string;
  problemSolved: string;
  howItWorks: string[];
  designNotes: string[];
  watchOut: string[];
  output: string;
};

type Tradeoff = {
  title: string;
  tension: string;
  resolution: string;
  impact: string;
};

const tabs: { id: TabKey; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: "pipeline", label: "Pipeline", icon: GitBranch },
  { id: "concepts", label: "Concepts", icon: BookOpenText },
  { id: "tradeoffs", label: "Tradeoffs", icon: BarChart3 },
  { id: "improvements", label: "Efficiency", icon: Gauge },
];

const ingestionStages: Stage[] = [
  {
    id: "upload",
    title: "PDF Upload",
    subtitle: "Raw financial report enters the system",
    icon: FileText,
    color: "bg-sky-600",
    location: "client/components/admin/upload/UploadDashboard.tsx -> server/src/modules/ingestion/ingestion.service.ts",
    purpose:
      "The pipeline starts with a PDF such as an annual report, filing, earnings release, or investor presentation.",
    whyBuilt:
      "A RAG system is only as good as the evidence it can ingest. This phase creates a controlled entry point for messy real-world PDFs before any retrieval or LLM work begins.",
    role:
      "It acts as the boundary between the user-facing product and the indexing backend: accept the file, extract text, create a document record, and hand the content to downstream processors.",
    problemSolved:
      "Without a dedicated upload and extraction phase, the rest of the pipeline would need to deal with binary PDFs, temporary files, inconsistent document names, and missing document ownership metadata.",
    howItWorks: [
      "The client sends the file to the ingestion API.",
      "The server extracts text from the PDF and immediately prepares it for indexing.",
      "The uploaded temporary file is removed after indexing to avoid stale local storage.",
    ],
    designNotes: [
      "The document record is created before vector upsert so chunks and tables can point back to a stable documentId.",
      "The UI exposes upload progress because embedding and indexing can take noticeably longer than a normal file upload.",
      "Temporary file cleanup is part of this phase because ingestion owns the file lifecycle.",
    ],
    watchOut: [
      "Scanned PDFs or image-heavy filings may need OCR before text extraction becomes reliable.",
      "Very large reports can produce many chunks, so ingestion latency grows with document length.",
      "Extraction quality directly affects every later phase; bad text cannot be fully rescued by retrieval.",
    ],
    output: "Plain extracted text plus the original document name.",
  },
  {
    id: "tables",
    title: "Table Extraction",
    subtitle: "Structured financial rows are preserved",
    icon: Table2,
    color: "bg-emerald-600",
    location: "server/src/services/tableExtraction.service.ts",
    purpose:
      "Financial questions often depend on tables where row-column relationships matter more than paragraph semantics.",
    whyBuilt:
      "Annual reports contain critical facts in tables: revenue by year, EBITDA, assets, liabilities, cash flow lines, segment figures, and margins. Plain chunking can flatten that structure and make numeric answers risky.",
    role:
      "This phase preserves structured financial evidence separately from narrative text so table-like questions can use table-like data.",
    problemSolved:
      "It reduces the chance that the assistant mixes values across rows, columns, periods, or metrics when answering comparison and calculation questions.",
    howItWorks: [
      "Detected tables are stored separately in Prisma as financial table records.",
      "Table retrieval can later be triggered for revenue, margin, balance sheet, or cash flow style questions.",
      "The answer prompt gives table data priority when table evidence and narrative text disagree.",
    ],
    designNotes: [
      "Tables are stored outside Qdrant because their shape matters, not only their semantic similarity.",
      "The prompt has explicit table reasoning rules so retrieved rows are treated as higher-precision evidence.",
      "Keeping tables separate creates a clean path for future metric-aware table scoring.",
    ],
    watchOut: [
      "The current table search is intentionally simple and can return broad table evidence.",
      "PDF table extraction can lose headers, units, or period labels if the source is poorly formatted.",
      "Numeric accuracy depends on preserving both the value and the label that explains what the value means.",
    ],
    output: "FinancialTable records that can be retrieved independently from vector chunks.",
  },
  {
    id: "chunk",
    title: "Smart Chunking",
    subtitle: "Text becomes retrievable evidence blocks",
    icon: Layers3,
    color: "bg-violet-600",
    location: "server/src/services/smartChunk.service.ts",
    purpose:
      "Long PDFs cannot be embedded or sent to the LLM as one blob, so the report is split into useful semantic chunks.",
    whyBuilt:
      "LLMs and embedding models work best when evidence is bounded. Smart chunking turns a report into retrievable units without losing the financial section context that explains each unit.",
    role:
      "It is the document segmentation layer: clean text, detect sections, remove low-value noise, create child chunks, and attach parent context.",
    problemSolved:
      "It prevents the system from retrieving either the whole report, which is too noisy, or tiny fragments, which are too context-poor for financial interpretation.",
    howItWorks: [
      "Text is cleaned, low-value noise is filtered, and very short chunks are ignored.",
      "Financial section hints such as risk factors, liquidity, revenue, capex, and cash flow are detected.",
      "Each child chunk keeps parent context so the system can recover surrounding meaning later.",
    ],
    designNotes: [
      "The implementation uses financial headings because reports have predictable domain structure.",
      "The roughly 1400-character chunk target balances retrieval precision with enough local context.",
      "Parent metadata is stored with each child so future expansion can recover surrounding paragraphs.",
    ],
    watchOut: [
      "Heading detection is heuristic, so unusual report formats may be labeled as general.",
      "Chunk boundaries may split a multi-sentence explanation if the paragraph stream is irregular.",
      "Aggressive filtering improves quality but may drop short yet important disclosures.",
    ],
    output: "Chunks with text, sectionTitle, chunkIndex, parentId, and parentText metadata.",
  },
  {
    id: "embed",
    title: "Embedding",
    subtitle: "Text is converted into numeric meaning",
    icon: BrainCircuit,
    color: "bg-orange-600",
    location: "server/src/services/embedding.service.ts",
    purpose:
      "Embeddings let semantically similar questions and report passages meet even when they do not share exact wording.",
    whyBuilt:
      "Users rarely phrase questions exactly like the report. Embeddings give the system a semantic bridge between natural questions and source language.",
    role:
      "It converts each chunk and each search query into the same vector space so Qdrant can compare meaning mathematically.",
    problemSolved:
      "It solves vocabulary mismatch, such as matching 'liquidity pressure' to passages about cash resources, working capital, debt maturity, or operating cash flow.",
    howItWorks: [
      "The project uses Xenova/bge-small-en-v1.5 locally through Transformers.",
      "Mean pooling and normalization produce stable vectors for similarity search.",
      "The embedding model is loaded lazily, so the first upload or search can be slower.",
    ],
    designNotes: [
      "Local embeddings avoid sending source documents to an external embedding API.",
      "Normalization makes vector similarity more stable across chunks of different wording and length.",
      "Lazy loading keeps startup simpler but moves the model-load cost to the first embedding call.",
    ],
    watchOut: [
      "Small embedding models can miss subtle financial nuance compared with larger hosted models.",
      "Embedding alone is weak for exact numbers, ticker symbols, and year-specific values.",
      "Sequential embedding during ingestion can become a bottleneck for long documents.",
    ],
    output: "Normalized vector arrays for every stored chunk.",
  },
  {
    id: "index",
    title: "Qdrant Index",
    subtitle: "Vectors and metadata are stored together",
    icon: Database,
    color: "bg-slate-800",
    location: "server/src/modules/qdrant/qdrant.service.ts and qdrant.client.ts",
    purpose:
      "Qdrant is the vector database that makes approximate semantic retrieval fast enough for chat.",
    whyBuilt:
      "Once chunks become vectors, they need a store optimized for nearest-neighbor search. A normal SQL text column is not enough for fast semantic retrieval.",
    role:
      "It is the searchable knowledge index: vectors support similarity search, while payload metadata supports filtering, boosting, source display, and traceability.",
    problemSolved:
      "It prevents every chat request from scanning and embedding the entire corpus again. The expensive indexing work is done once during ingestion.",
    howItWorks: [
      "Each point stores the vector plus payload metadata such as documentId, documentName, companyName, sectionTitle, and parentText.",
      "Metadata is used later for boosting, source display, and company-aware retrieval.",
      "The collection name used by the app is financial_docs.",
    ],
    designNotes: [
      "Storing metadata beside the vector keeps retrieval results self-contained.",
      "Company and section fields make domain-specific ranking possible after the raw vector search.",
      "Qdrant can later support payload filters so irrelevant companies or sections are excluded earlier.",
    ],
    watchOut: [
      "If payload metadata is missing or inconsistent, source formatting and boosting become weaker.",
      "Vector search returns semantically close chunks, not guaranteed correct financial facts.",
      "Indexing succeeds only if the vector dimension and collection configuration stay aligned.",
    ],
    output: "Searchable vector points ready for question answering.",
  },
];

const answerStages: Stage[] = [
  {
    id: "memory",
    title: "Conversation Memory",
    subtitle: "Follow-up questions get context",
    icon: MessageSquareText,
    color: "bg-cyan-700",
    location: "server/src/modules/retrieval/conversationMemory.service.ts",
    purpose:
      "A user may ask, 'what about margins?' after previously discussing a company. Memory keeps that thread usable.",
    whyBuilt:
      "Financial conversations are naturally multi-turn. Users ask follow-ups that depend on a company, metric, or section already mentioned instead of repeating the full context.",
    role:
      "It extracts lightweight retrieval hints from recent chat history before search begins.",
    problemSolved:
      "It prevents follow-up questions from becoming ambiguous searches. For example, 'compare that with cash flow' can remain tied to the company and topic already being discussed.",
    howItWorks: [
      "Recent messages are loaded from Prisma.",
      "The service extracts company and topic hints such as risk, cash flow, capex, and margin.",
      "Those hints later boost chunks from the current company or relevant section.",
    ],
    designNotes: [
      "The memory object is intentionally small so it can influence retrieval without flooding the prompt.",
      "Company tracking is separated from answer generation; it affects which chunks are preferred.",
      "Topic hints are domain-specific because financial follow-ups usually orbit metrics and sections.",
    ],
    watchOut: [
      "Heuristic memory can carry stale company context if the user switches topics abruptly.",
      "Boosting from memory should help ranking, but it should not override strong contradictory evidence.",
      "A future version should scope memory per chat rather than relying on broad module-level state.",
    ],
    output: "RetrievalMemory containing recentTopics, recentDocuments, recentSections, and currentCompany.",
  },
  {
    id: "rewrite",
    title: "Rewrite and Multi-Query",
    subtitle: "One user question becomes better search input",
    icon: Sparkles,
    color: "bg-fuchsia-700",
    location: "server/src/modules/memory/rewrite.service.ts and server/src/services/multiQuery.service.ts",
    purpose:
      "Human questions are often underspecified. Rewriting and expansion make retrieval less brittle.",
    whyBuilt:
      "A raw user question is optimized for conversation, not search. Rewriting turns conversational language into a standalone retrieval query, while multi-query expansion explores alternate financial wording.",
    role:
      "It is the query preparation layer between chat input and search execution.",
    problemSolved:
      "It improves recall when the report uses different terminology than the user, and it fixes vague follow-ups that depend on prior turns.",
    howItWorks: [
      "The chat controller rewrites the user query using recent history.",
      "The retrieval service can also generate multiple financial search queries.",
      "The original query is kept in the set so expansion cannot completely drift away.",
    ],
    designNotes: [
      "The original query remains part of the search set as an anchor against query drift.",
      "Generated queries are capped to avoid turning one question into unbounded retrieval work.",
      "The prompt asks the query generator to keep company names and financial terminology.",
    ],
    watchOut: [
      "LLM-generated search queries can introduce related but unintended concepts.",
      "More queries increase latency because each query fans out into hybrid search.",
      "Rewrite quality depends on the recent chat history being relevant and concise.",
    ],
    output: "Up to five search queries optimized for retrieval.",
  },
  {
    id: "hybrid",
    title: "Hybrid Retrieval",
    subtitle: "Semantic, lexical, metadata, and table search work together",
    icon: Search,
    color: "bg-indigo-700",
    location: "server/src/modules/retrieval/search/hybrid.search.ts",
    purpose:
      "No single search method is enough for financial reports because numbers, exact terms, sections, and semantics all matter.",
    whyBuilt:
      "Financial QA has multiple retrieval needs at once: semantic understanding, exact metric names, section targeting, company awareness, and structured table evidence.",
    role:
      "It is the main candidate-generation engine. It gathers possible evidence from several retrieval lanes before ranking gets stricter.",
    problemSolved:
      "It avoids the failure mode where vector search misses exact values, keyword search misses paraphrases, or table-heavy questions are answered from narrative text alone.",
    howItWorks: [
      "Vector search finds meaning matches in Qdrant.",
      "Keyword search catches exact financial terms and values.",
      "Section intent can trigger metadata search, while table intent can trigger table search.",
      "Reciprocal rank fusion merges ranked lists without assuming all scores are comparable.",
    ],
    designNotes: [
      "Vector and keyword searches run in parallel to reduce latency.",
      "Section and table intent detection adds domain routing instead of treating all questions the same.",
      "Reciprocal rank fusion is used because raw scores from different search methods are not directly comparable.",
    ],
    watchOut: [
      "Candidate generation should favor recall; later phases are responsible for precision.",
      "Naive keyword counts can overvalue repeated words in low-quality chunks.",
      "The current table lane is useful but should become more selective for production-grade numeric QA.",
    ],
    output: "A fused candidate list of evidence chunks and table snippets.",
  },
  {
    id: "rerank",
    title: "Boosting, Deduping, Reranking",
    subtitle: "Candidates are cleaned and prioritized",
    icon: Network,
    color: "bg-amber-600",
    location: "server/src/modules/retrieval/search/reranker.ts and utils/",
    purpose:
      "Retrieval needs a quality pass before context is sent to the model, otherwise irrelevant chunks waste prompt space.",
    whyBuilt:
      "Hybrid search intentionally casts a wide net. This phase narrows that net so the prompt receives the most useful evidence instead of every plausible match.",
    role:
      "It is the evidence selection layer: remove duplicates, apply domain boosts, reward query overlap, penalize noisy chunks, and choose the final top candidates.",
    problemSolved:
      "It reduces prompt bloat, repeated sources, off-topic chunks, and weak evidence that could distract the LLM.",
    howItWorks: [
      "Duplicates are removed after multi-query and hybrid search.",
      "Metadata boosts reward matching companies, sections, and recent conversation topics.",
      "The reranker adds financial-term, query-overlap, and chunk-quality signals.",
    ],
    designNotes: [
      "Deduplication is essential because multi-query search can retrieve the same chunk several times.",
      "Financial term boosts help domain-rich chunks outrank generic narrative language.",
      "Company and topic boosts let memory influence the result without hard-filtering away alternatives.",
    ],
    watchOut: [
      "Heuristic reranking is transparent and fast, but it is less accurate than a trained cross-encoder reranker.",
      "Over-boosting metadata can bury relevant evidence from another section.",
      "Returning too few chunks can improve focus but hurt recall for broad analysis questions.",
    ],
    output: "The top evidence chunks, currently sliced to eight for the final context path.",
  },
  {
    id: "compress",
    title: "Context Compression",
    subtitle: "Relevant sentences are kept under control",
    icon: Zap,
    color: "bg-rose-600",
    location: "server/src/services/contextCompression.service.ts",
    purpose:
      "A strong retrieval set can still be too verbose. Compression protects the prompt budget and improves answer focus.",
    whyBuilt:
      "Even the right chunks may contain extra sentences. The LLM should spend attention on evidence that answers the question, not on unrelated paragraphs from the same chunk.",
    role:
      "It is the prompt-budget control layer between retrieval and source formatting.",
    problemSolved:
      "It lowers token cost, reduces distraction, and makes room for citations, table instructions, calculation context, and response-style instructions.",
    howItWorks: [
      "Each chunk is split into sentences.",
      "Sentences containing query terms are preferred.",
      "The compressed text is capped before source formatting.",
    ],
    designNotes: [
      "Compression happens after ranking so only selected chunks are shortened.",
      "The fallback keeps original chunk text when no query-term sentence is found.",
      "The cap makes prompt size predictable enough for streamed chat responses.",
    ],
    watchOut: [
      "Term-based compression can remove useful sentences that use synonyms.",
      "Definitions, units, and prior-period baselines may live in neighboring sentences.",
      "A semantic compressor or sentence reranker would be safer for complex questions.",
    ],
    output: "Shorter source snippets that preserve the most query-relevant text.",
  },
  {
    id: "prompt",
    title: "Prompt and Streaming Answer",
    subtitle: "Evidence becomes a cited analyst response",
    icon: ShieldCheck,
    color: "bg-teal-700",
    location: "server/src/services/prompt.service.ts and server/src/modules/llm/llm.service.ts",
    purpose:
      "The final prompt turns retrieved evidence into a grounded financial analyst answer with citations and table rules.",
    whyBuilt:
      "The LLM needs strict instructions because financial answers must be cited, conservative, numerically careful, and clear about missing evidence.",
    role:
      "It is the reasoning and presentation layer: assemble sources, apply response style, stream the answer, persist messages, and verify support after generation.",
    problemSolved:
      "It reduces hallucination risk, enforces citation behavior, adapts answer structure to query type, and gives the UI a live streamed response.",
    howItWorks: [
      "The query classifier selects response style such as fact lookup, comparison, summary, or analysis.",
      "The prompt requires every factual claim to cite a source and blocks unsupported facts.",
      "Groq streams llama-3.3-70b-versatile output back to the UI as server-sent events.",
      "A verifier model checks whether the final answer is supported by the provided context.",
    ],
    designNotes: [
      "Table-aware rules tell the model to preserve row-column relationships and prioritize table evidence for metrics.",
      "Different query types get different response scaffolds so fact lookups stay concise and analysis gets structure.",
      "Verification runs after streaming, so the user gets responsiveness while the system still records support quality.",
    ],
    watchOut: [
      "Prompt rules improve behavior but do not mathematically guarantee correctness.",
      "Verifier output is another model judgment and should be tracked with evaluation data.",
      "If retrieval misses the right evidence, the prompt can only say that the information was not found.",
    ],
    output: "A streamed answer, source list, and verification flag.",
  },
];

const concepts = [
  {
    title: "Retrieval-Augmented Generation",
    body:
      "RAG lets the LLM answer from retrieved project documents instead of relying on its training memory. In this app, generation is deliberately delayed until retrieval, compression, and source formatting have produced a grounded evidence pack.",
  },
  {
    title: "Embedding",
    body:
      "An embedding is a numeric representation of text meaning. Similar questions and passages sit near each other in vector space, so a question about liquidity can still find a passage that says cash resources or working capital.",
  },
  {
    title: "Hybrid Search",
    body:
      "Vector search is good at meaning; keyword search is good at exact wording and figures; metadata search is good at sections and companies; table search is good at structured financial statements. The project combines them because financial QA punishes missing one of these signals.",
  },
  {
    title: "Reciprocal Rank Fusion",
    body:
      "RRF merges multiple ranked result lists by rank position rather than raw score. That matters because a Qdrant similarity score, keyword count, metadata hit, and table score do not naturally live on the same scale.",
  },
  {
    title: "Parent-Child Retrieval",
    body:
      "Child chunks keep retrieval precise, while parent text preserves surrounding context. The code stores parentId and parentText during chunking so the system can avoid answering from isolated fragments.",
  },
  {
    title: "Context Compression",
    body:
      "The app trims retrieved chunks before prompting. This reduces token cost and makes the prompt more focused, but it must be done carefully because aggressive trimming can remove definitions or comparison baselines.",
  },
  {
    title: "Citation Grounding",
    body:
      "Sources are formatted into numbered evidence blocks, and the prompt requires citations on factual claims. The verifier adds a second pass to catch unsupported responses after streaming completes.",
  },
  {
    title: "Financial Table Reasoning",
    body:
      "Tables are treated as first-class evidence because financial metrics depend on rows, columns, periods, and units. The prompt explicitly tells the model not to mix years, quarters, or rows.",
  },
];

const tradeoffs: Tradeoff[] = [
  {
    title: "Chunk Size: Precision vs Context",
    tension:
      "Small chunks retrieve precise facts but can lose the surrounding explanation. Large chunks preserve context but add noise and consume more prompt tokens.",
    resolution:
      "The project uses smart child chunks around 1400 characters and stores parentText. Retrieval stays focused, while parent metadata keeps the door open for broader context.",
    impact:
      "Better source relevance with less prompt waste, especially for dense annual-report sections.",
  },
  {
    title: "Local Embeddings vs Hosted Embeddings",
    tension:
      "Hosted embeddings can be stronger and operationally simple, but they add cost, latency, and external data movement. Local embeddings are private and cheap, but model loading and CPU inference can be slower.",
    resolution:
      "The app uses Xenova/bge-small-en-v1.5 locally with lazy loading. It favors privacy and simple local development over maximum embedding quality.",
    impact:
      "Good enough semantic search for local financial reports, with a slower first request that can be improved by warmup.",
  },
  {
    title: "Vector Search vs Keyword Search",
    tension:
      "Vector search understands meaning but may miss exact metrics, names, and financial vocabulary. Keyword search catches exact terms but fails on paraphrases.",
    resolution:
      "Hybrid search runs both and merges them with reciprocal rank fusion, then applies financial and metadata boosts.",
    impact:
      "Questions like 'liquidity position' and 'cash flow' can both land on useful evidence.",
  },
  {
    title: "Multi-Query Recall vs Cost",
    tension:
      "Generating multiple search queries improves recall, but each query fans out into more searches and more reranking work.",
    resolution:
      "The generated query list is capped and always includes the original query. Results are deduplicated before the final rerank.",
    impact:
      "Recall improves without letting expansion dominate latency or context size.",
  },
  {
    title: "Table Search Simplicity vs Numeric Accuracy",
    tension:
      "Tables are essential for financial QA, but robust table extraction and retrieval are difficult. A naive table search is easy to ship but may include broad table evidence.",
    resolution:
      "The app stores extracted tables separately and uses table-aware prompt rules. This gives table data a separate path while keeping the first version understandable.",
    impact:
      "The system has a foundation for numeric reasoning, though table retrieval can be made much more selective.",
  },
  {
    title: "Strict Grounding vs Helpful Analysis",
    tension:
      "A financial assistant should explain implications, but analysis can drift into unsupported claims if the prompt is too loose.",
    resolution:
      "The prompt allows interpretation only from retrieved sources, requires citations, and asks the model to say when evidence is missing.",
    impact:
      "Answers are more conservative, which is the right default for financial research.",
  },
];

const improvements = [
  {
    title: "Pre-warm the embedding model",
    effort: "Low",
    gain: 68,
    body:
      "Load Xenova/bge-small-en-v1.5 when the server starts or after the first health check. This removes the slow first ingestion/search surprise.",
  },
  {
    title: "Batch embeddings during ingestion",
    effort: "Medium",
    gain: 78,
    body:
      "The ingestion loop currently embeds chunks one by one. Batching can reduce overhead and make large reports index faster.",
  },
  {
    title: "Use Qdrant payload filters",
    effort: "Medium",
    gain: 72,
    body:
      "When currentCompany, documentId, or section intent is known, pass filters into vector search instead of only boosting after retrieval.",
  },
  {
    title: "Make table retrieval query-aware",
    effort: "Medium",
    gain: 82,
    body:
      "Score tables by matching metric names, years, quarters, units, and company names. This would improve numeric answers and reduce irrelevant table context.",
  },
  {
    title: "Cache query embeddings and rewrites",
    effort: "Low",
    gain: 58,
    body:
      "Repeated or similar questions can reuse embeddings, generated search queries, and rewritten query output for faster follow-up interactions.",
  },
  {
    title: "Add evaluation traces",
    effort: "High",
    gain: 88,
    body:
      "Create a small golden dataset of financial questions with expected source chunks. Track recall, citation support, latency, and unsupported-answer rate.",
  },
];

const retrievalMix = [
  { label: "Vector", value: 36, color: "bg-indigo-600" },
  { label: "Keyword", value: 24, color: "bg-emerald-600" },
  { label: "Metadata", value: 18, color: "bg-amber-500" },
  { label: "Tables", value: 22, color: "bg-rose-600" },
];

function StageDetail({ stage }: { stage: Stage }) {
  const Icon = stage.icon;

  return (
    <section className="border border-slate-200 bg-white p-5 shadow-sm rounded-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${stage.color}`}>
            <Icon size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-950">{stage.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{stage.subtitle}</p>
          </div>
        </div>
        <div className="max-w-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 rounded-lg">
          <span className="font-semibold text-slate-900">Code path: </span>
          {stage.location}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg">
          <p className="text-xs font-bold uppercase text-slate-500">Why This Phase Exists</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{stage.whyBuilt}</p>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg">
          <p className="text-xs font-bold uppercase text-slate-500">Role in the Pipeline</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{stage.role}</p>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg">
          <p className="text-xs font-bold uppercase text-slate-500">Problem It Solves</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{stage.problemSolved}</p>
        </div>
      </div>

      <div className="mt-5 border border-slate-200 bg-white p-4 rounded-lg">
        <p className="text-xs font-bold uppercase text-slate-500">Core Purpose</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{stage.purpose}</p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="border border-slate-200 p-4 rounded-lg">
          <h3 className="text-sm font-bold text-slate-950">How It Works</h3>
          <ol className="mt-4 space-y-3">
            {stage.howItWorks.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-6 text-slate-700">{item}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-4">
          <div className="border border-slate-200 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-slate-950">Design Notes</h3>
            <ul className="mt-3 space-y-2">
              {stage.designNotes.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-1 shrink-0 text-emerald-600" size={15} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-amber-200 bg-amber-50 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-amber-900">What To Watch</h3>
            <ul className="mt-3 space-y-2">
              {stage.watchOut.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-amber-900">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-5 border-l-4 border-slate-900 bg-slate-50 p-4 rounded-lg">
        <p className="text-xs font-bold uppercase text-slate-500">Output Passed Forward</p>
        <p className="mt-1 text-sm font-medium text-slate-900">{stage.output}</p>
      </div>
    </section>
  );
}

function PipelineMap({
  stages,
  selected,
  onSelect,
}: {
  stages: Stage[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const active = selected === stage.id;

        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onSelect(stage.id)}
            className={`group min-h-32 border p-4 text-left transition rounded-lg ${
              active
                ? "border-slate-900 bg-white shadow-md"
                : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${stage.color}`}>
                <Icon size={18} />
              </div>
              <span className="text-xs font-bold text-slate-400">0{index + 1}</span>
            </div>
            <p className="mt-4 text-sm font-bold text-slate-950">{stage.title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{stage.subtitle}</p>
          </button>
        );
      })}
    </div>
  );
}

function FusionChart() {
  return (
    <section className="border border-slate-200 bg-white p-5 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase text-slate-500">Retrieval Signal Mix</h3>
          <p className="mt-1 text-sm text-slate-600">Conceptual contribution of each retrieval lane before final reranking.</p>
        </div>
        <LineChart className="text-slate-400" size={22} />
      </div>
      <div className="mt-5 space-y-4">
        {retrievalMix.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{item.label}</span>
              <span>{item.value}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-lg bg-slate-100">
              <div className={`h-full rounded-lg ${item.color}`} style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PipelinePrinciples({ flow }: { flow: "ingestion" | "answer" }) {
  const principles =
    flow === "ingestion"
      ? [
          {
            title: "Goal",
            body: "Convert unstructured PDFs into searchable, traceable evidence before any user asks a question.",
          },
          {
            title: "Main Risk",
            body: "If extraction, chunking, or metadata is weak, retrieval cannot reliably find the right facts later.",
          },
          {
            title: "Quality Lever",
            body: "Preserve document identity, section labels, parent context, company hints, and table rows during indexing.",
          },
        ]
      : [
          {
            title: "Goal",
            body: "Turn a conversational question into a compact, cited evidence pack and then a grounded answer.",
          },
          {
            title: "Main Risk",
            body: "If retrieval misses the right evidence, the LLM may be forced to answer from incomplete context.",
          },
          {
            title: "Quality Lever",
            body: "Use memory, query expansion, hybrid search, reranking, compression, and strict prompt rules together.",
          },
        ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {principles.map((item) => (
        <div key={item.title} className="border border-slate-200 bg-white p-4 rounded-lg">
          <p className="text-xs font-bold uppercase text-slate-500">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{item.body}</p>
        </div>
      ))}
    </section>
  );
}

function ConceptGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {concepts.map((concept) => (
        <article key={concept.title} className="border border-slate-200 bg-white p-5 rounded-lg">
          <h3 className="text-base font-bold text-slate-950">{concept.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-700">{concept.body}</p>
        </article>
      ))}
    </div>
  );
}

function TradeoffList() {
  const [open, setOpen] = useState(tradeoffs[0].title);

  return (
    <div className="space-y-3">
      {tradeoffs.map((tradeoff) => {
        const active = open === tradeoff.title;

        return (
          <article key={tradeoff.title} className="border border-slate-200 bg-white rounded-lg">
            <button
              type="button"
              onClick={() => setOpen(active ? "" : tradeoff.title)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <div>
                <h3 className="text-base font-bold text-slate-950">{tradeoff.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{tradeoff.impact}</p>
              </div>
              <ChevronDown className={`shrink-0 text-slate-400 transition ${active ? "rotate-180" : ""}`} size={20} />
            </button>
            {active && (
              <div className="grid gap-4 border-t border-slate-100 p-5 md:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase text-rose-600">Tradeoff</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{tradeoff.tension}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-indigo-600">Resolution</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{tradeoff.resolution}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-600">Result</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{tradeoff.impact}</p>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function Improvements() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {improvements.map((item) => (
        <article key={item.title} className="border border-slate-200 bg-white p-5 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.body}</p>
            </div>
            <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
              {item.effort}
            </span>
          </div>
          <div className="mt-5">
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Expected efficiency gain</span>
              <span>{item.gain}/100</span>
            </div>
            <div className="h-3 overflow-hidden rounded-lg bg-slate-100">
              <div className="h-full rounded-lg bg-teal-600" style={{ width: `${item.gain}%` }} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function DocumentationPage() {
  const [tab, setTab] = useState<TabKey>("pipeline");
  const [flow, setFlow] = useState<"ingestion" | "answer">("answer");
  const currentStages = flow === "ingestion" ? ingestionStages : answerStages;
  const [selectedStage, setSelectedStage] = useState(answerStages[0].id);

  const selected = useMemo(
    () => currentStages.find((stage) => stage.id === selectedStage) || currentStages[0],
    [currentStages, selectedStage],
  );

  const handleFlowChange = (nextFlow: "ingestion" | "answer") => {
    setFlow(nextFlow);
    setSelectedStage(nextFlow === "ingestion" ? ingestionStages[0].id : answerStages[0].id);
  };

  return (
    <main className="h-screen overflow-y-auto bg-slate-100 text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="border border-slate-200 bg-white p-5 shadow-sm rounded-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
                <ArrowLeft size={16} />
                Back to chat
              </Link>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Financial RAG Interactive Documentation
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This guide explains how the project turns PDFs into searchable financial evidence, then turns user questions into cited analyst-style answers. The emphasis is on why each step exists, what tradeoff it handles, and where the implementation can become faster or more accurate.
              </p>
            </div>
            <div className="grid min-w-64 grid-cols-2 gap-2">
              <div className="border border-slate-200 bg-slate-50 p-3 rounded-lg">
                <p className="text-xs font-bold uppercase text-slate-500">Vector DB</p>
                <p className="mt-1 text-lg font-bold text-slate-950">Qdrant</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-3 rounded-lg">
                <p className="text-xs font-bold uppercase text-slate-500">LLM</p>
                <p className="mt-1 text-lg font-bold text-slate-950">Groq</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-3 rounded-lg">
                <p className="text-xs font-bold uppercase text-slate-500">Embedding</p>
                <p className="mt-1 text-lg font-bold text-slate-950">BGE Small</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-3 rounded-lg">
                <p className="text-xs font-bold uppercase text-slate-500">Evidence</p>
                <p className="mt-1 text-lg font-bold text-slate-950">Cited</p>
              </div>
            </div>
          </div>
        </header>

        <nav className="grid gap-2 sm:grid-cols-4">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center justify-center gap-2 border px-4 py-3 text-sm font-bold transition rounded-lg ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {tab === "pipeline" && (
          <div className="space-y-5">
            <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="border border-slate-200 bg-white p-5 rounded-lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Full RAG Pipeline</h2>
                    <p className="mt-1 text-sm text-slate-600">Switch between ingestion and answer generation, then click any stage.</p>
                  </div>
                  <div className="grid grid-cols-2 overflow-hidden border border-slate-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleFlowChange("ingestion")}
                      className={`px-4 py-2 text-sm font-bold ${flow === "ingestion" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
                    >
                      Ingestion
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlowChange("answer")}
                      className={`px-4 py-2 text-sm font-bold ${flow === "answer" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
                    >
                      Answering
                    </button>
                  </div>
                </div>
                <div className="mt-5">
                  <PipelineMap stages={currentStages} selected={selected.id} onSelect={setSelectedStage} />
                </div>
              </div>
              <FusionChart />
            </section>
            <PipelinePrinciples flow={flow} />
            <StageDetail stage={selected} />
          </div>
        )}

        {tab === "concepts" && (
          <div className="space-y-5">
            <section className="border border-slate-200 bg-white p-5 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-600" size={22} />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Conceptual Model</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    The system is designed around one principle: retrieve the smallest trustworthy evidence set before asking the LLM to write.
                  </p>
                </div>
              </div>
            </section>
            <ConceptGrid />
          </div>
        )}

        {tab === "tradeoffs" && (
          <div className="space-y-5">
            <section className="border border-slate-200 bg-white p-5 rounded-lg">
              <h2 className="text-lg font-bold text-slate-950">Tradeoffs and How This Project Resolves Them</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                RAG systems are mostly a series of compromises: recall versus precision, speed versus grounding, context versus cost, and helpful analysis versus hallucination risk. These are the main decisions visible in this codebase.
              </p>
            </section>
            <TradeoffList />
          </div>
        )}

        {tab === "improvements" && (
          <div className="space-y-5">
            <section className="grid gap-4 border border-slate-200 bg-white p-5 rounded-lg lg:grid-cols-[1fr_320px]">
              <div>
                <h2 className="text-lg font-bold text-slate-950">What Would Make It More Efficient</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The current design is understandable and extensible. The biggest next wins are reducing repeated work, filtering earlier, making table retrieval smarter, and adding evaluation so improvements are measured rather than guessed.
                </p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg">
                <p className="text-xs font-bold uppercase text-slate-500">Best next move</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                  Add embedding warmup and batched ingestion first; they improve latency without changing answer behavior.
                </p>
              </div>
            </section>
            <Improvements />
          </div>
        )}
      </div>
    </main>
  );
}
