export const extractFinancialNumbers = (tableRows: any) => {
  const numbers: number[] = [];

  const walk = (value: any) => {
    if (typeof value === "number") {
      numbers.push(value);
      return;
    }

    if (typeof value === "string") {
      const match = value.replace(/,/g, "");

      const parsed = Number(match);

      if (!isNaN(parsed)) {
        numbers.push(parsed);
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(walk);
    }
  };

  walk(tableRows);

  return numbers;
};
