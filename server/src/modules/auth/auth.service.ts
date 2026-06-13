import prisma from "../../config/prisma";

/**
 * Upsert instead of find-then-create: the previous version raced under
 * concurrent first requests from the same new user (unique violation).
 * The duplicate requireAdmin that lived here has been consolidated into
 * middleware/admin.middleware.ts.
 */
export const ensureUserExists = async (userId: string) => {
  return prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });
};
