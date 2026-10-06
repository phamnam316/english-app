import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { getNextLesson, pickContinueCourse } from "@/lib/course-progress";
import { getCourseSummaries } from "@/lib/courses";
import { getPracticeWords } from "@/lib/practice-data";
import { PASSING_SCORE } from "@/lib/scoring";
import { startOfVietnamDay } from "@/lib/streak";
import type { HomeResponse } from "@/types/api";

/**
 * GET /api/home
 * Mọi thứ trang chủ cần trong 1 request: khóa học + tiến độ, mục tiêu hôm nay (1 bài + 1 lượt ôn),
 * số từ đến hạn ôn và các từ của bài nên học tiếp.
 */
export async function GET() {
  try {
    const user = await requireSessionUser();
    const now = new Date();

    const courses = await getCourseSummaries({ userId: user.id, isAdmin: user.role === "ADMIN" });
    const course = pickContinueCourse(courses);
    const nextLessonId = course ? getNextLesson(course)?.lesson.id : undefined;

    const [{ words, dueCount }, todayActivities, nextLessonWords] = await Promise.all([
      getPracticeWords(user.id, courses, now),
      prisma.activity.findMany({
        where: { userId: user.id, createdAt: { gte: startOfVietnamDay(now) } },
        select: { type: true, score: true },
      }),
      nextLessonId
        ? prisma.vocabulary.findMany({
            where: { lessonId: nextLessonId },
            orderBy: { order: "asc" },
            select: { id: true, word: true, phonetic: true },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json<HomeResponse>({
      courses,
      today: {
        lessonsCompleted: todayActivities.filter(
          (a) => a.type === "LESSON" && (a.score === null || a.score >= PASSING_SCORE),
        ).length,
        practiceRounds: todayActivities.filter((a) => a.type === "PRACTICE").length,
      },
      review: {
        wordCount: words.length,
        dueCount,
        weakCount: words.filter((w) => w.rating === 1 || w.rating === 2).length,
      },
      nextLessonWords,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/home");
  }
}
