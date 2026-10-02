import { NextResponse } from "next/server";
import type { PracticeMode } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api-error";
import { getCourseSummaries } from "@/lib/courses";
import { withLessonStates } from "@/lib/course-progress";
import { PRACTICE_DAILY_XP_CAP, practiceXp } from "@/lib/practice";
import { getNextStreak, startOfVietnamDay } from "@/lib/streak";
import { practiceResultSchema } from "@/lib/validations";
import { wordKey } from "@/lib/word-rating";
import { getWordRatings } from "@/lib/words";
import type { PracticeDataResponse, PracticeResultResponse, PracticeWord } from "@/types/api";

/** Đủ cho mọi trò chơi mà không gửi quá nhiều dữ liệu */
const MAX_WORDS = 300;

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
 * kèm XP luyện tập hôm nay và kỷ lục từng trò.
 */
export async function GET() {
  try {
    const user = await requireSessionUser();

    const courses = await getCourseSummaries({ userId: user.id, isAdmin: user.role === "ADMIN" });
    const unlockedLessonIds = courses.flatMap((course) =>
      withLessonStates(course).flatMap((unit) => unit.lessons.filter((l) => l.state !== "locked").map((l) => l.id)),
    );

    const [vocabularies, ratings, todayXp, bestRows] = await Promise.all([
      prisma.vocabulary.findMany({
        where: { lessonId: { in: unlockedLessonIds } },
        orderBy: [{ lessonId: "asc" }, { order: "asc" }],
        select: {
          id: true,
          word: true,
          phonetic: true,
          meaning: true,
          exampleSentence: true,
          exampleTranslation: true,
          cefr: true,
          audioUrl: true,
        },
      }),
      getWordRatings(user.id),
      getTodayPracticeXp(user.id, new Date()),
      prisma.activity.groupBy({
        by: ["mode"],
        where: { userId: user.id, type: "PRACTICE" },
        _max: { score: true },
      }),
    ]);

    // Cùng 1 từ có thể xuất hiện ở nhiều bài/khóa: chỉ giữ 1 lần
    const seen = new Set<string>();
    const words: PracticeWord[] = [];
    for (const vocab of vocabularies) {
      const key = wordKey(vocab.word);
      if (seen.has(key)) continue;
      seen.add(key);
      words.push({ ...vocab, rating: ratings.get(key) ?? null });
    }
    // Quá nhiều từ thì giữ từ chưa nhớ / hơi nhớ / chưa đánh giá trước, từ "Đã nhớ" sau cùng
    const priority = (word: PracticeWord) => (word.rating === null ? 2 : word.rating);
    words.sort((a, b) => priority(a) - priority(b));
    words.splice(MAX_WORDS);

    const bestScores: Partial<Record<PracticeMode, number>> = {};
    for (const row of bestRows) {
      if (row.mode && row._max.score !== null) bestScores[row.mode] = row._max.score;
    }

    return NextResponse.json<PracticeDataResponse>({
      words,
      stats: { todayXp, dailyXpCap: PRACTICE_DAILY_XP_CAP, bestScores },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/practice");
  }
}

/**
 * POST /api/practice
 * Body: { mode, correct, total, score }
 *
 * Lưu 1 lượt luyện tập: mỗi câu đúng 1 XP (tối đa 10/lượt, 50/ngày), tính vào streak nếu có ít nhất 1 câu đúng.
 * Kết quả do trình duyệt gửi lên nên có giới hạn XP mỗi ngày để không ai "cày" XP được.
 */
export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const { mode, correct, score } = practiceResultSchema.parse(await parseJsonBody(request));
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

    return NextResponse.json<PracticeResultResponse>(result);
  } catch (error) {
    return handleApiError(error, "POST /api/practice");
  }
}
