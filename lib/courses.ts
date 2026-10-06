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
 * Cấu trúc khóa học (khóa, chương, bài, số từ / số câu) chỉ đổi khi chạy seed lúc deploy, nên được giữ trong bộ nhớ
 * của server vài phút: mỗi request chỉ còn 1 truy vấn tiến độ của user thay vì đọc lại cả cây khóa học.
 */
const COURSE_TREE_TTL_MS = 5 * 60_000;

function loadCourseTree() {
  return prisma.course.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      level: true,
      imageUrl: true,
      isPublished: true,
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
}

type CourseTree = Awaited<ReturnType<typeof loadCourseTree>>;

let treeCache: { promise: Promise<CourseTree>; expiresAt: number } | null = null;

/** Cây khóa học (gồm cả khóa chưa publish), dùng lại kết quả trong COURSE_TREE_TTL_MS */
export function getCourseTree(): Promise<CourseTree> {
  if (treeCache && treeCache.expiresAt > Date.now()) return treeCache.promise;
  const promise = loadCourseTree();
  treeCache = { promise, expiresAt: Date.now() + COURSE_TREE_TTL_MS };
  // Lỗi DB không được lưu lại: request sau thử lại
  promise.catch(() => {
    if (treeCache?.promise === promise) treeCache = null;
  });
  return promise;
}

/** Bài kế tiếp trong khóa (theo thứ tự chương, bài) */
export async function getNextLessonInCourse(courseId: string, lessonId: string) {
  const course = (await getCourseTree()).find((c) => c.id === courseId);
  const lessons = course?.units.flatMap((unit) => unit.lessons) ?? [];
  const position = lessons.findIndex((l) => l.id === lessonId);
  const next = position >= 0 ? lessons[position + 1] : undefined;
  return next ? { id: next.id, title: next.title } : null;
}

/**
 * Danh sách khóa học kèm chương, bài và tiến độ của user.
 * Dùng chung cho GET /api/courses và trang Luyện tập (lấy từ vựng của các bài đã mở khóa).
 */
export async function getCourseSummaries({ userId, isAdmin = false }: CourseQuery): Promise<CourseSummary[]> {
  const [tree, progressRows] = await Promise.all([
    getCourseTree(),
    userId
      ? prisma.userProgress.findMany({
          where: { userId },
          select: { lessonId: true, status: true, score: true },
        })
      : Promise.resolve([]),
  ]);
  const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

  return tree
    .filter((course) => isAdmin || course.isPublished)
    .map(({ isPublished: _isPublished, ...course }) => {
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
