import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { ApiError, handleApiError, parseJsonBody } from "@/lib/api-error";
import { checkAnswerSchema } from "@/lib/validations";
import { isAnswerCorrect } from "@/lib/scoring";
import type { CheckAnswerResponse } from "@/types/api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/lessons/[id]/check
 * Body: { quizId: string, answer: string }
 *
 * Chấm NGAY 1 câu khi user bấm "Kiểm tra" để hiện banner đúng/sai. Chỉ đọc, không ghi DB:
 * tiến độ và XP vẫn chỉ được cập nhật ở /submit (server chấm lại toàn bộ bài).
 * Nhờ vậy GET /api/lessons/[id] vẫn không phải gửi đáp án xuống trình duyệt.
 *
 * 200 - { quizId, isCorrect, correctAnswer, explanation }
 * 400 - Body sai
 * 401 - Chưa đăng nhập
 * 404 - Câu hỏi không thuộc bài học này / bài học chưa publish
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await requireSessionUser();
    const { id: lessonId } = await params;

    const body = await parseJsonBody(request);
    const { quizId, answer } = checkAnswerSchema.parse(body);

    const exercise = await prisma.exercise.findFirst({
      where: { id: quizId, lessonId },
      select: {
        id: true,
        correctAnswer: true,
        explanation: true,
        lesson: { select: { unit: { select: { course: { select: { isPublished: true } } } } } },
      },
    });

    if (!exercise || (!exercise.lesson.unit.course.isPublished && user.role !== "ADMIN")) {
      throw new ApiError(404, "NOT_FOUND", "Không tìm thấy câu hỏi trong bài học này.");
    }

    return NextResponse.json<CheckAnswerResponse>({
      quizId: exercise.id,
      isCorrect: isAnswerCorrect(answer, exercise.correctAnswer),
      correctAnswer: exercise.correctAnswer,
      explanation: exercise.explanation,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/lessons/[id]/check");
  }
}
