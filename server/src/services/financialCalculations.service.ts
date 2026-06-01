export const calculateGrowthRate = (current: number, previous: number) => {
  if (previous === 0) {
    return null;
  }
  return (((current - previous) / previous) * 100).toFixed(2);
};

export const calculateMargin = (profit: number, revenue: number) => {
  if (revenue === 0) {
    return null;
  }
  return ((profit / revenue) * 100).toFixed(2);
};

export const buildCalculationContext = () => {
  return `
Available Financial Calculations:

1. Growth Rate
Formula:
((Current - Previous) / Previous) * 100

2. Profit Margin
Formula:
(Profit / Revenue) * 100

3. CAGR
Formula:
((Ending / Beginning)^(1/n) - 1) * 100
`;
};
