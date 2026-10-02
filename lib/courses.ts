import type { ProgressStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { CourseSummary } from "@/types/api";

interface CourseQuery {
  /** Không có user: mọi bài là NOT_STARTED */
  userId?: string;
  /** ADMIN thấy cả khóa học chưa publish */
  isAdmin?: boolean;
}

/**
 * Danh sách khóa học kèm chương, bài và tiến độ của user.
 * Dùng chung cho GET /api/courses và trang Luyện tập (lấy từ vựng của các bài đã mở khóa).
 */
export async function getCourseSummaries({ userId, isAdmin = false }: CourseQuery): Promise<CourseSummary[]> {
  const courses = await prisma.course.findMany({
    where: isAdmin ? undefined : { isPublished: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      level: true,
      imageUrl: true,
      units: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              order: true,
              xpReward: true,
              _count: { select: { vocabularies: true, exercises: true } },
            },
          },
        },
      },
    },
  });

  const progressRows = userId
    ? await prisma.userProgress.findMany({
        where: { userId },
        select: { lessonId: true, status: true, score: true },
      })
    : [];
  const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

  return courses.map((course) => {
    let totalLessons = 0;
    let completedLessons = 0;

    const units = course.units.map((unit) => {
      const lessons = unit.lessons.map(({ _count, ...lesson }) => {
        const progress = progressByLesson.get(lesson.id);
        const status: ProgressStatus = progress?.status ?? "NOT_STARTED";
        return {
          ...lesson,
          vocabCount: _count.vocabularies,
          exerciseCount: _count.exercises,
          status,
          score: progress?.score ?? null,
        };
      });
      const unitCompleted = lessons.filter((l) => l.status === "COMPLETED").length;
      totalLessons += lessons.length;
      completedLessons += unitCompleted;
      return { ...unit, totalLessons: lessons.length, completedLessons: unitCompleted, lessons };
    });

    return {
      ...course,
      totalLessons,
      completedLessons,
      progressPercent: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
      units,
    };
  });
}
