import { PrismaClient } from "@prisma/client";

/**
 * Một PrismaClient duy nhất cho cả app. Ở chế độ dev, Next.js nạp lại module mỗi lần sửa code:
 * giữ client trong globalThis để không mở thêm kết nối DB sau mỗi lần hot reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
