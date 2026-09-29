import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      xp: number;
      streak: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    xp?: number;
    streak?: number;
    /** Thời điểm (ms) nạp role/xp/streak từ DB lần gần nhất */
    syncedAt?: number;
  }
}
