import { NextResponse } from "next/server";
import type { PracticeMode } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api-error";
import { getCourseSummaries } from "@/lib/courses";
import { PRACTICE_DAILY_XP_CAP, practiceXp } from "@/lib/practice";
import { getPracticeWords } from "@/lib/practice-data";
import { recordReviews } from "@/lib/review-schedule";
import { getNextStreak, startOfVietnamDay } from "@/lib/streak";
import { practiceResultSchema } from "@/lib/validations";
import type { PracticeDataResponse, PracticeResultResponse } from "@/types/api";

async function getTodayPracticeXp(userId: string, now: Date): Promise<number> {
  const today = await prisma.activity.aggregate({
    where: { userId, type: "PRACTICE", createdAt: { gte: startOfVietnamDay(now) } },
    _sum: { xpEarned: true },
  });
  return today._sum.xpEarned ?? 0;
}

/**
 * GET /api/practice
 * Từ vựng để chơi: lấy từ các bài đã mở khóa (đã học xong hoặc bài đang học) của mọi khóa học,
 * từ đến hạn ôn đứng trước, kèm XP luyện tập hôm nay và kỷ lục từng trò.
 */
export async function GET() {
  try {
    const user = await requireSessionUser();

    const courses = await getCourseSummaries({ userId: user.id, isAdmin: user.role === "ADMIN" });
    const [{ words, dueCount }, todayXp, bestRows] = await Promise.all([
      getPracticeWords(user.id, courses),
      getTodayPracticeXp(user.id, new Date()),
      prisma.activity.groupBy({
        by: ["mode"],
        where: { userId: user.id, type: "PRACTICE" },
        _max: { score: true },
      }),
    ]);

    const bestScores: Partial<Record<PracticeMode, number>> = {};
    for (const row of bestRows) {
      if (row.mode && row._max.score !== null) bestScores[row.mode] = row._max.score;
    }

    return NextResponse.json<PracticeDataResponse>({
      words,
      dueCount,
      stats: { todayXp, dailyXpCap: PRACTICE_DAILY_XP_CAP, bestScores },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/practice");
  }
}

/**
 * POST /api/practice
 * Body: { mode, correct, total, score, reviewed? }
 *
 * Lưu 1 lượt luyện tập: mỗi câu đúng 1 XP (tối đa 10/lượt, 50/ngày), tính vào streak nếu có ít nhất 1 câu đúng.
 * Kết quả do trình duyệt gửi lên nên có giới hạn XP mỗi ngày để không ai "cày" XP được.
 */
export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const { mode, correct, score, reviewed } = practiceResultSchema.parse(await parseJsonBody(request));
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const today = await tx.activity.aggregate({
        where: { userId: user.id, type: "PRACTICE", createdAt: { gte: startOfVietnamDay(now) } },
        _sum: { xpEarned: true },
      });
      const todayXpBefore = today._sum.xpEarned ?? 0;
      const xpEarned = Math.max(0, Math.min(practiceXp(correct), PRACTICE_DAILY_XP_CAP - todayXpBefore));

      const best = await tx.activity.aggregate({
        where: { userId: user.id, type: "PRACTICE", mode },
        _max: { score: true },
      });
      const previousBest = best._max.score;

      await tx.activity.create({ data: { userId: user.id, type: "PRACTICE", mode, score, xpEarned } });

      const dbUser = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { streak: true, lastActiveAt: true },
      });
      const practiced = correct > 0;
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          xp: { increment: xpEarned },
          ...(practiced && {
            streak: getNextStreak(dbUser.streak, dbUser.lastActiveAt, now),
            lastActiveAt: now,
          }),
        },
        select: { xp: true, streak: true },
      });

      return {
        xpEarned,
        totalXp: updated.xp,
        newStreak: updated.streak,
        todayXp: todayXpBefore + xpEarned,
        dailyXpCap: PRACTICE_DAILY_XP_CAP,
        bestScore: Math.max(previousBest ?? 0, score),
        isNewBest: score > 0 && (previousBest === null || score > previousBest),
      };
    });

    // Lịch ôn từng từ: ghi sau giao dịch chính (lỗi ở đây không làm mất XP vừa nhận)
    if (reviewed?.length) await recordReviews(user.id, reviewed, now);

    return NextResponse.json<PracticeResultResponse>(result);
  } catch (error) {
    return handleApiError(error, "POST /api/practice");
  }
}
