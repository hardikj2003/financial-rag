interface ChunkMetadata {
  sectionTitle: string;
  chunkIndex: number;
  parentId: string;
  parentText: string;
}

export interface SmartChunk {
  text: string;
  metadata: ChunkMetadata;
}

const FINANCIAL_HEADINGS = [
  "management discussion",
  "financial highlights",
  "risk factors",
  "capital expenditure",
  "results of operations",
  "business overview",
  "liquidity",
  "cash flow",
  "investments",
  "operational performance",
  "segment performance",
];

const CHILD_CHUNK_SIZE = 1400;
const PARENT_TEXT_LIMIT = 3000;
const MIN_CHUNK_CHARS = 120;
const MIN_CHUNK_WORDS = 25;

/**
 * A heading is a short standalone LINE matching a known section name. The
 * previous detector ran `includes()` over whole passages, so any sentence
 * containing the word "revenue" started a new "section".
 */
const detectHeading = (line: string): string | null => {
  if (line.length === 0 || line.length > 90) return null;

  const lower = line.toLowerCase();
  return FINANCIAL_HEADINGS.find((h) => lower.includes(h)) ?? null;
};

const isUsefulChunk = (text: string): boolean =>
  text.length >= MIN_CHUNK_CHARS &&
  text.split(/\s+/).length >= MIN_CHUNK_WORDS;

interface Section {
  title: string;
  paragraphs: string[];
}

/**
 * Normalizes whitespace WITHOUT destroying line structure. The previous
 * cleaner collapsed every `\s+` to a single space, which deleted all
 * paragraph boundaries and silently turned "paragraph chunking" into
 * sentence chunking.
 */
const toLines = (text: string): string[] =>
  text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => !/^page \d+( of \d+)?$/i.test(line));

const buildSections = (lines: string[]): Section[] => {
  const sections: Section[] = [{ title: "general", paragraphs: [] }];
  let paragraph = "";

  const flushParagraph = () => {
    if (paragraph.trim().length > 0) {
      sections[sections.length - 1].paragraphs.push(paragraph.trim());
    }
    paragraph = "";
  };

  for (const line of lines) {
    if (line === "") {
      flushParagraph();
      continue;
    }

    const heading = detectHeading(line);
    if (heading) {
      flushParagraph();
      sections.push({ title: heading, paragraphs: [] });
      continue;
    }

    paragraph += (paragraph ? " " : "") + line;
  }

  flushParagraph();

  return sections.filter((section) => section.paragraphs.length > 0);
};

/**
 * Sections are built first, then chunked — so every child of a section
 * carries the SAME complete parent text. The previous implementation
 * accumulated the parent while emitting children, giving each child a
 * different partial parent.
 */
export const createSmartChunks = (text: string): SmartChunk[] => {
  const sections = buildSections(toLines(text));
  const chunks: SmartChunk[] = [];
  let chunkIndex = 0;

  sections.forEach((section, sectionIndex) => {
    const parentId = `parent-${sectionIndex}`;
    const parentText = section.paragraphs.join("\n\n").slice(0, PARENT_TEXT_LIMIT);

    let current = "";

    const flushChunk = () => {
      const trimmed = current.trim();
      if (isUsefulChunk(trimmed)) {
        chunks.push({
          text: trimmed,
          metadata: {
            sectionTitle: section.title,
            chunkIndex: chunkIndex++,
            parentId,
            parentText,
          },
        });
      }
      current = "";
    };

    for (const paragraph of section.paragraphs) {
      if (current.length + paragraph.length > CHILD_CHUNK_SIZE && current) {
        flushChunk();
      }
      current += (current ? "\n\n" : "") + paragraph;
    }

    flushChunk();
  });

  return chunks;
};
