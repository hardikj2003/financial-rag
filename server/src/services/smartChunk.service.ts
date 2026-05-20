interface ChunkMetadata {
  sectionTitle: string;
  chunkIndex: number;
  // Parent-Child Retrieval
  parentId: string;
  parentText: string;
}

interface SmartChunk {
  text: string;
  metadata: ChunkMetadata;
}

const FINANCIAL_HEADINGS = [
  "management discussion",
  "financial highlights",
  "risk factors",
  "capital expenditure",
  "revenue",
  "earnings",
  "results of operations",
  "business overview",
  "liquidity",
  "cash flow",
  "investments",
  "operational performance",
  "segment performance",
];

const detectSectionTitle = (text: string) => {
  const lower = text.toLowerCase();

  for (const heading of FINANCIAL_HEADINGS) {
    if (lower.includes(heading)) {
      return heading;
    }
  }

  return "general";
};

const cleanText = (text: string) => {
  return text
    .replace(/\s+/g, " ")
    .replace(/[$#@%^&*]{3,}/g, "")
    .replace(/page \d+/gi, "")
    .trim();
};

const isUsefulChunk = (text: string) => {
  if (text.length < 120) {
    return false;
  }

  const weirdPatterns = (text.match(/[@#$%^&*]{5,}/g) || []).length;

  if (weirdPatterns > 5) {
    return false;
  }

  const words = text.split(/\s+/);

  if (words.length < 40) {
    return false;
  }

  return true;
};

export const createSmartChunks = (text: string): SmartChunk[] => {
  const cleaned = cleanText(text);

  // Paragraph-level segmentation
  const paragraphs = cleaned.split(/\.\s+/).filter((p) => p.trim().length > 80);
  const chunks: SmartChunk[] = [];

  let currentChunk = "";
  let currentSection = "general";
  let chunkIndex = 0;

  // Parent Section State
  let currentParentText = "";
  let currentParentId = "parent-0";
  let sectionIndex = 0;

  for (const paragraph of paragraphs) {
    // Detect Financial Section
    const detectedSection = detectSectionTitle(paragraph);

    // New Section Boundary
    if (detectedSection !== "general" && detectedSection !== currentSection) {
      currentSection = detectedSection;
      sectionIndex++;
      currentParentId = `parent-${sectionIndex}`;
      currentParentText = "";
    }
    // Build Parent Section
    currentParentText += paragraph + ". ";

    // Build Semantic Child Chunks
    if (currentChunk.length + paragraph.length < 1400) {
      currentChunk += "\n\n" + paragraph;
    } else {
      if (isUsefulChunk(currentChunk)) {
        chunks.push({
          text: currentChunk.trim(),
          metadata: {
            sectionTitle: currentSection,
            chunkIndex,
            parentId: currentParentId,
            parentText: currentParentText.trim(),
          },
        });
        chunkIndex++;
      }

      currentChunk = paragraph;
    }
  }

  // Push Final Chunk
  if (isUsefulChunk(currentChunk)) {
    chunks.push({
      text: currentChunk.trim(),
      metadata: {
        sectionTitle: currentSection,
        chunkIndex,
        parentId: currentParentId,
        parentText: currentParentText.trim(),
      },
    });
  }

  console.log("SMART CHUNKS CREATED:", {
    totalChunks: chunks.length,
    sample: chunks[0],
  });

  return chunks;
};
