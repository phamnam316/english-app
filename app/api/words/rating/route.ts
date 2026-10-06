import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api-error";
import { scheduleForRating } from "@/lib/review-schedule";
import { wordRatingSchema } from "@/lib/validations";
import { wordKey } from "@/lib/word-rating";
import type { WordRatingResponse } from "@/types/api";

/**
 * PUT /api/words/rating
 * Body: { word, rating: 1 | 2 | 3 | null }
 *
 * Lưu mức nhớ người học tự đánh giá cho 1 từ (1 Chưa nhớ, 2 Hơi nhớ, 3 Đã nhớ) và đặt lịch ôn tương ứng
 * (1 / 3 / 7 ngày). null = bỏ đánh giá, lịch ôn giữ nguyên.
 */
export async function PUT(request: Request) {
  try {
    const user = await requireSessionUser();
    const { word, rating } = wordRatingSchema.parse(await parseJsonBody(request));
    const key = wordKey(word);
    const where = { userId_word: { userId: user.id, word: key } };

    if (rating === null) {
      await prisma.wordReview.updateMany({ where: { userId: user.id, word: key }, data: { rating: null } });
    } else {
      const current = await prisma.wordReview.findUnique({ where, select: { intervalDays: true, dueAt: true } });
      const schedule = scheduleForRating(rating, current);
      await prisma.wordReview.upsert({
        where,
        create: { userId: user.id, word: key, rating, ...schedule },
        update: { rating, ...schedule },
      });
    }

    return NextResponse.json<WordRatingResponse>({ word: key, rating });
  } catch (error) {
    return handleApiError(error, "PUT /api/words/rating");
  }
}
