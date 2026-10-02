import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api-error";
import { wordRatingSchema } from "@/lib/validations";
import { wordKey } from "@/lib/word-rating";
import type { WordRatingResponse } from "@/types/api";

/**
 * PUT /api/words/rating
 * Body: { word, rating: 1 | 2 | 3 | null }
 *
 * Lưu mức nhớ người học tự đánh giá cho 1 từ (1 Chưa nhớ, 2 Hơi nhớ, 3 Đã nhớ); null = bỏ đánh giá.
 * Trang Luyện tập dùng mức nhớ để ưu tiên từ chưa nhớ.
 */
export async function PUT(request: Request) {
  try {
    const user = await requireSessionUser();
    const { word, rating } = wordRatingSchema.parse(await parseJsonBody(request));
    const key = wordKey(word);

    if (rating === null) {
      await prisma.wordReview.deleteMany({ where: { userId: user.id, word: key } });
    } else {
      await prisma.wordReview.upsert({
        where: { userId_word: { userId: user.id, word: key } },
        create: { userId: user.id, word: key, rating },
        update: { rating },
      });
    }

    return NextResponse.json<WordRatingResponse>({ word: key, rating });
  } catch (error) {
    return handleApiError(error, "PUT /api/words/rating");
  }
}
