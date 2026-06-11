interface MetricRecord {
  metricName: string;
  period: string;
  value: number;
}

export const extractFinancialMetrics = (tableRows: any): MetricRecord[] => {
  const metrics: MetricRecord[] = [];

  try {
    for (const row of tableRows) {
      if (!Array.isArray(row) || row.length < 2) {
        continue;
      }

      const period = String(row[0]);

      const value = Number(String(row[1]).replace(/,/g, ""));

      if (!isNaN(value)) {
        metrics.push({
          metricName: "Revenue",
          period,
          value,
        });
      }
    }
  } catch {
    return [];
  }

  return metrics;
};
