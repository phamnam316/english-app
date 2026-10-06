import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api-error";
import { getNextLessonInCourse } from "@/lib/courses";
import { toGrammarNote, toLessonStory } from "@/lib/lesson-content";
import { wordKey } from "@/lib/word-rating";
import { getWordRatings } from "@/lib/words";
import type { LessonDetailResponse } from "@/types/api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Cột options là Json: chỉ nhận mảng chuỗi, còn lại coi như câu tự điền (null) */
function toOptions(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.filter((v): v is string => typeof v === "string");
  return items.length > 0 ? items : null;
}

/**
 * GET /api/lessons/[id]
 * Chi tiết 1 bài: từ vựng (kèm mức nhớ của user) + ghi chú ngữ pháp + câu hỏi (KHÔNG kèm đáp án/giải thích)
 * + tiến độ của user + bài kế tiếp trong khóa.
 *
 * 200 - { lesson }
 * 401 - Chưa đăng nhập
 * 404 - Không có bài / khóa học chưa publish
 */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireSessionUser();
    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        order: true,
        xpReward: true,
        grammarNote: true,
        story: true,
        unit: {
          select: {
            id: true,
            title: true,
            order: true,
            course: { select: { id: true, title: true, level: true, isPublished: true } },
          },
        },
        vocabularies: {
          orderBy: [{ order: "asc" }, { word: "asc" }],
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
        },
        exercises: {
          orderBy: { order: "asc" },
          select: { id: true, question: true, type: true, options: true, audioUrl: true, audioText: true, order: true },
        },
        progress: {
          where: { userId: user.id },
          select: { status: true, score: true, completedAt: true },
        },
      },
    });

    if (!lesson || (!lesson.unit.course.isPublished && user.role !== "ADMIN")) {
      throw new ApiError(404, "NOT_FOUND", "Không tìm thấy bài học.");
    }

    const { course, ...unit } = lesson.unit;
    const progress = lesson.progress[0];

    const [ratings, nextLesson] = await Promise.all([
      getWordRatings(
        user.id,
        lesson.vocabularies.map((v) => v.word),
      ),
      getNextLessonInCourse(course.id, lesson.id),
    ]);

    return NextResponse.json<LessonDetailResponse>({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        xpReward: lesson.xpReward,
        unit,
        course: { id: course.id, title: course.title, level: course.level },
        grammarNote: toGrammarNote(lesson.grammarNote),
        story: toLessonStory(lesson.story),
        vocabularies: lesson.vocabularies.map((vocab) => ({
          ...vocab,
          rating: ratings.get(wordKey(vocab.word)) ?? null,
        })),
        exercises: lesson.exercises.map((exercise) => ({ ...exercise, options: toOptions(exercise.options) })),
        progress: {
          status: progress?.status ?? "NOT_STARTED",
          score: progress?.score ?? null,
          completedAt: progress?.completedAt?.toISOString() ?? null,
        },
        nextLesson,
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/lessons/[id]");
  }
}
