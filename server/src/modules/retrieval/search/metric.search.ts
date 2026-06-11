import prisma from "../../../config/prisma";

export const metricSearch = async (metricName: string) => {
  return prisma.financialMetric.findMany({
    where: {
      metricName: {
        contains: metricName,
        mode: "insensitive",
      },
    },
    orderBy: {
      period: "desc",
    },
    take: 10,
  });
};
