import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { getDisplayStreak, startOfVietnamWeek } from "@/lib/streak";
import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardResponse } from "@/types/api";

const TOP_SIZE = 20;

interface RankedUser {
  id: string;
  name: string | null;
  image: string | null;
  xp: number;
  streak: number;
  lastActiveAt: Date | null;
}

/** Chỉ hiện tên (không bao giờ hiện email) để bảng xếp hạng không lộ thông tin cá nhân */
function toEntry(user: RankedUser, rank: number, xp: number, meId: string): LeaderboardEntry {
  return {
    rank,
    name: user.name?.trim() || "Học viên ẩn danh",
    image: user.image,
    xp,
    streak: getDisplayStreak(user.streak, user.lastActiveAt),
    isMe: user.id === meId,
  };
}

const USER_SELECT = { id: true, name: true, image: true, xp: true, streak: true, lastActiveAt: true } as const;

/**
 * GET /api/leaderboard?period=week|all
 * week: XP nhận được từ thứ Hai tuần này (giờ Việt Nam), gồm bài học lần đầu hoàn thành và luyện tập.
 * all: tổng XP từ trước tới nay.
 */
export async function GET(request: Request) {
  try {
    const me = await requireSessionUser();
    const period: LeaderboardPeriod = new URL(request.url).searchParams.get("period") === "all" ? "all" : "week";

    if (period === "all") {
      const top = await prisma.user.findMany({
        where: { xp: { gt: 0 } },
        orderBy: [{ xp: "desc" }, { createdAt: "asc" }],
        take: TOP_SIZE,
        select: USER_SELECT,
      });
      const entries = top.map((user, i) => toEntry(user, i + 1, user.xp, me.id));

      let meEntry: LeaderboardEntry | null = null;
      if (!entries.some((e) => e.isMe)) {
        const meUser = await prisma.user.findUnique({ where: { id: me.id }, select: USER_SELECT });
        if (meUser && meUser.xp > 0) {
          const ahead = await prisma.user.count({ where: { xp: { gt: meUser.xp } } });
          meEntry = toEntry(meUser, ahead + 1, meUser.xp, me.id);
        }
      }
      return NextResponse.json<LeaderboardResponse>({ period, entries, me: meEntry });
    }

    const totals = await prisma.activity.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: startOfVietnamWeek() } },
      _sum: { xpEarned: true },
    });
    const ranked = totals
      .map((row) => ({ userId: row.userId, xp: row._sum.xpEarned ?? 0 }))
      .filter((row) => row.xp > 0)
      .sort((a, b) => b.xp - a.xp);

    const myIndex = ranked.findIndex((row) => row.userId === me.id);
    const wanted = ranked.slice(0, TOP_SIZE);
    if (myIndex >= TOP_SIZE) wanted.push(ranked[myIndex]);

    const users = await prisma.user.findMany({
      where: { id: { in: wanted.map((row) => row.userId) } },
      select: USER_SELECT,
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    const entries: LeaderboardEntry[] = [];
    for (const [i, row] of ranked.slice(0, TOP_SIZE).entries()) {
      const user = userById.get(row.userId);
      if (user) entries.push(toEntry(user, i + 1, row.xp, me.id));
    }

    let meEntry: LeaderboardEntry | null = null;
    if (myIndex >= TOP_SIZE) {
      const user = userById.get(me.id);
      if (user) meEntry = toEntry(user, myIndex + 1, ranked[myIndex].xp, me.id);
    }

    return NextResponse.json<LeaderboardResponse>({ period, entries, me: meEntry });
  } catch (error) {
    return handleApiError(error, "GET /api/leaderboard");
  }
}
