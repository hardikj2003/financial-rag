interface KeywordResult {
  score: number;
  payload: any;
}

export const keywordSearch = (
  query: string,
  chunks: any[],
): KeywordResult[] => {
  const queryTerms = query.toLowerCase().split(/\s+/);

  return chunks
    .map((chunk) => {
      const text = (chunk.payload?.text || "").toLowerCase();
      let score = 0;

      for (const term of queryTerms) {
        // Exact keyword match
        if (text.includes(term)) {
          score += 10;
        }
        // Financial abbreviation bonus
        if (term.length <= 5 && text.includes(term)) {
          score += 5;
        }
        // Numeric bonus
        if (/\d/.test(term) && text.includes(term)) {
          score += 8;
        }
      }

      return {
        ...chunk,
        keywordScore: score,
      };
    })
    .sort((a, b) => b.keywordScore - a.keywordScore);
};
