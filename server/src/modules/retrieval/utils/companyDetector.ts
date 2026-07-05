/**
 * Canonical company → aliases. The canonical key is what gets stored as
 * `companyName` at ingestion and used as the Qdrant filter value at query
 * time, so both sides stay consistent. Aliases let us recognise the many
 * ways a company is referred to (e.g. "SBI", "State Bank of India", "SBIN").
 */
const COMPANY_ALIASES: Record<string, string[]> = {
  reliance: ["reliance industries", "reliance", "ril"],
  infosys: ["infosys", "infy"],
  tcs: ["tata consultancy services", "tcs"],
  wipro: ["wipro"],
  hdfc: ["hdfc bank", "hdfc"],
  icici: ["icici bank", "icici"],
  adani: ["adani"],
  ltimindtree: ["ltimindtree", "lti mindtree"],
  sbi: ["state bank of india", "sbi", "sbin"],
  heromotocorp: ["hero motocorp", "heromotocorp"],
  techmahindra: ["tech mahindra", "techmahindra"],
  adija: ["adija technologies", "adijatechnologies"],
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Index of the earliest occurrence of any alias, or -1. */
const earliestMatch = (lower: string, aliases: string[]): number => {
  let earliest = -1;

  for (const alias of aliases) {
    const match = new RegExp(`\\b${escapeRegExp(alias)}\\b`).exec(lower);
    if (match && (earliest === -1 || match.index < earliest)) {
      earliest = match.index;
    }
  }

  return earliest;
};

/**
 * Returns every canonical company mentioned in the text, ordered by first
 * appearance. Used to detect comparison queries ("Reliance vs SBI") and to
 * drive per-company retrieval.
 */
export const detectCompanies = (text: string): string[] => {
  const lower = text.toLowerCase();

  return Object.entries(COMPANY_ALIASES)
    .map(([canonical, aliases]) => ({
      canonical,
      index: earliestMatch(lower, aliases),
    }))
    .filter((entry) => entry.index !== -1)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.canonical);
};

/**
 * The single most prominent (earliest-mentioned) company, or undefined.
 * Backwards-compatible with existing callers (memory, ingestion).
 */
export const detectCompany = (text: string): string | undefined =>
  detectCompanies(text)[0];
