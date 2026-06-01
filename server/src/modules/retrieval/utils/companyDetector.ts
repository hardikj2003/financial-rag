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
  "heromotocorp"
];

export const detectCompany = (
  text: string,
): string | undefined => {
  const lower = text.toLowerCase();

  return COMPANIES.find((company) =>
    lower.includes(company),
  );
};