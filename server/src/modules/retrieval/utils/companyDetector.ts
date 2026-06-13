const COMPANIES = [
  "reliance",
  "infosys",
  "tcs",
  "wipro",
  "hdfc",
  "icici",
  "adani",
  "ltimindtree",
  "sbin",
  "heromotocorp",
];

/**
 * Returns the company mentioned earliest in the text (word-boundary match).
 * The previous version returned whichever company came first in the COMPANIES
 * array, so a Reliance report mentioning Infosys in a peer comparison could
 * be mislabeled depending on list order.
 */
export const detectCompany = (text: string): string | undefined => {
  const lower = text.toLowerCase();

  let best: { company: string; index: number } | undefined;

  for (const company of COMPANIES) {
    const match = new RegExp(`\\b${company}\\b`).exec(lower);

    if (match && (!best || match.index < best.index)) {
      best = { company, index: match.index };
    }
  }

  return best?.company;
};
