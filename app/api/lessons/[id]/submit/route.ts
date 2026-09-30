import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { ApiError, handleApiError, parseJsonBody } from "@/lib/api-error";
import { gradeAnswers } from "@/lib/scoring";
import { getNextStreak } from "@/lib/streak";
import { submitLessonSchema } from "@/lib/validations";
import type { SubmitLessonResponse } from "@/types/api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/lessons/[id]/submit
 * Body: { answers: [{ quizId, selectedOption }] }
 *
 * Server chấm lại toàn bộ bài (không tin kết quả từ client), lưu tiến độ, cộng XP và cập nhật streak.
 * XP chỉ được cộng ở lần ĐẦU TIÊN đậu bài.
 *
 * 200 - SubmitLessonResponse
 * 400 - Body sai / quizId không thuộc bài học
 * 401 - Chưa đăng nhập
 * 404 - Không có bài / khóa học chưa publish
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await requireSessionUser();
    const { id: lessonId } = await params;

    const body = await parseJsonBody(request);
    const { answers } = submitLessonSchema.parse(body);

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        xpReward: true,
        unit: { select: { course: { select: { isPublished: true } } } },
        exercises: {
          orderBy: { order: "asc" },
          select: { id: true, type: true, correctAnswer: true, explanation: true },
        },
      },
    });

    if (!lesson || (!lesson.unit.course.isPublished && user.role !== "ADMIN")) {
      throw new ApiError(404, "NOT_FOUND", "Không tìm thấy bài học.");
    }
    if (lesson.exercises.length === 0) {
      throw new ApiError(400, "NO_EXERCISES", "Bài học này không có bài tập để nộp.");
    }

    const exerciseIds = new Set(lesson.exercises.map((e) => e.id));
    if (answers.some((a) => !exerciseIds.has(a.quizId))) {
      throw new ApiError(400, "INVALID_QUIZ", "Có câu trả lời không thuộc bài học này.");
    }

    const grade = gradeAnswers(lesson.exercises, answers);
    const now = new Date();
    const progressKey = { userId_lessonId: { userId: user.id, lessonId } };

    const outcome = await prisma.$transaction(async (tx) => {
      const existing = await tx.userProgress.upsert({
        where: progressKey,
        create: { userId: user.id, lessonId, status: "IN_PROGRESS" },
        update: {},
        select: { score: true },
      });

      // Đánh dấu COMPLETED có điều kiện: 2 request nộp cùng lúc chỉ 1 request được tính là lần đầu
      let isFirstCompletion = false;
      if (grade.passed) {
        const claimed = await tx.userProgress.updateMany({
          where: { userId: user.id, lessonId, status: { not: "COMPLETED" } },
          data: { status: "COMPLETED", completedAt: now },
        });
        isFirstCompletion = claimed.count === 1;
      }

      // Giữ điểm cao nhất
      if (existing.score === null || grade.score > existing.score) {
        await tx.userProgress.update({ where: progressKey, data: { score: grade.score } });
      }

      const dbUser = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { streak: true, lastActiveAt: true },
      });
      const xpEarned = isFirstCompletion ? lesson.xpReward : 0;
      // Ghi lại để tính bảng xếp hạng tuần
      if (xpEarned > 0) {
        await tx.activity.create({ data: { userId: user.id, type: "LESSON", xpEarned, lessonId } });
      }

      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          xp: { increment: xpEarned },
          streak: getNextStreak(dbUser.streak, dbUser.lastActiveAt, now),
          lastActiveAt: now,
        },
        select: { xp: true, streak: true },
      });

      return { isFirstCompletion, xpEarned, totalXp: updated.xp, newStreak: updated.streak };
    });

    return NextResponse.json<SubmitLessonResponse>({
      passed: grade.passed,
      score: grade.score,
      xpEarned: outcome.xpEarned,
      newStreak: outcome.newStreak,
      totalXp: outcome.totalXp,
      correctCount: grade.correctCount,
      totalQuestions: grade.totalQuestions,
      isFirstCompletion: outcome.isFirstCompletion,
      results: grade.results,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/lessons/[id]/submit");
  }
}
