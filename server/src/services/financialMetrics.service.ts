export const calculateYoYGrowth = (current: number, previous: number) => {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
};

export const calculateMargin = (numerator: number, denominator: number) => {
  if (!denominator) return null;
  return (numerator / denominator) * 100;
};

export const calculateCAGR = (
  beginning: number,
  ending: number,
  years: number,
) => {
  if (!beginning || !years) return null;

  return (Math.pow(ending / beginning, 1 / years) - 1) * 100;
};
