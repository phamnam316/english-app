import { NextResponse } from "next/server";
import type { ProgressStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import type { CourseListResponse, CourseSummary } from "@/types/api";

/**
 * GET /api/courses
 * Danh sách khóa học đã publish (ADMIN thấy cả bản nháp), kèm chương, bài và tiến độ của user.
 * Không bắt buộc đăng nhập: khách xem được danh sách, mọi bài là NOT_STARTED.
 */
export async function GET() {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;
    const isAdmin = session?.user?.role === "ADMIN";

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
              select: { id: true, title: true, order: true, xpReward: true },
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

    const result: CourseSummary[] = courses.map((course) => {
      let totalLessons = 0;
      let completedLessons = 0;

      const units = course.units.map((unit) => {
        const lessons = unit.lessons.map((lesson) => {
          const progress = progressByLesson.get(lesson.id);
          const status: ProgressStatus = progress?.status ?? "NOT_STARTED";
          return { ...lesson, status, score: progress?.score ?? null };
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

    return NextResponse.json<CourseListResponse>({ isAuthenticated: Boolean(userId), courses: result });
  } catch (error) {
    return handleApiError(error, "GET /api/courses");
  }
}
