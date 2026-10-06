/**
 * Lịch ôn từ vựng theo kiểu lặp lại ngắt quãng: ôn đúng lúc sắp quên thì nhớ lâu nhất.
 *
 * Mỗi từ có 1 khoảng cách ôn (ngày) đi theo thang 1 → 3 → 7 → 14 → 30 → 60:
 * - Học xong bài: các từ của bài đến hạn ôn sau 1 ngày.
 * - Ôn đúng lúc đến hạn: lên bậc tiếp theo. Ôn đúng khi chưa đến hạn: giữ nguyên (không "học dồn" để nhảy bậc).
 * - Ôn sai: về lại 1 ngày.
 * - Tự đánh giá trong bài: Chưa nhớ = 1 ngày, Hơi nhớ = 3 ngày, Đã nhớ = 7 ngày.
 * Hạn ôn luôn là 0:00 (giờ Việt Nam) của ngày đến hạn: "hôm nay cần ôn" tính theo ngày, không theo giờ.
 */
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { startOfVietnamDay } from "@/lib/streak";
import { wordKey } from "@/lib/word-rating";
import type { WordRating } from "@/types/api";

export const REVIEW_STEPS = [1, 3, 7, 14, 30, 60] as const;
const RATING_INTERVAL: Record<WordRating, number> = { 1: 1, 2: 3, 3: 7 };
const DAY_MS = 24 * 60 * 60 * 1000;

/** Bậc tiếp theo trên thang ôn */
export function nextInterval(current: number): number {
  return REVIEW_STEPS.find((step) => step > current) ?? REVIEW_STEPS[REVIEW_STEPS.length - 1];
}

/** 0:00 (giờ Việt Nam) của ngày cách hôm nay `days` ngày */
export function dueDateAfter(days: number, now = new Date()): Date {
  return startOfVietnamDay(new Date(now.getTime() + days * DAY_MS));
}

type Db = Prisma.TransactionClient | typeof prisma;

/** Lịch ôn khi người học tự đánh giá mức nhớ trong bài */
export function scheduleForRating(
  rating: WordRating,
  current: { intervalDays: number; dueAt: Date | null } | null,
  now = new Date(),
): { intervalDays: number; dueAt: Date } {
  const interval = RATING_INTERVAL[rating];
  // "Đã nhớ" với từ đã ở bậc cao hơn: giữ lịch cũ, không kéo lùi
  if (rating === 3 && current?.dueAt && current.intervalDays > interval) {
    return { intervalDays: current.intervalDays, dueAt: current.dueAt };
  }
  return { intervalDays: interval, dueAt: dueDateAfter(interval, now) };
}

/** Học xong 1 bài: lên lịch ôn sau 1 ngày cho các từ chưa có lịch (từ đã có lịch giữ nguyên) */
export async function scheduleLearnedWords(db: Db, userId: string, words: string[], now = new Date()): Promise<void> {
  const keys = [...new Set(words.map(wordKey))];
  if (keys.length === 0) return;
  const existing = await db.wordReview.findMany({
    where: { userId, word: { in: keys } },
    select: { word: true, dueAt: true },
  });
  const scheduled = new Set(existing.filter((r) => r.dueAt).map((r) => r.word));
  const unscheduledRows = new Set(existing.filter((r) => !r.dueAt).map((r) => r.word));
  const dueAt = dueDateAfter(1, now);

  const fresh = keys.filter((k) => !scheduled.has(k) && !unscheduledRows.has(k));
  if (fresh.length > 0) {
    await db.wordReview.createMany({
      data: fresh.map((word) => ({ userId, word, intervalDays: 1, dueAt })),
      skipDuplicates: true,
    });
  }
  if (unscheduledRows.size > 0) {
    await db.wordReview.updateMany({
      where: { userId, word: { in: [...unscheduledRows] }, dueAt: null },
      data: { intervalDays: 1, dueAt },
    });
  }
}

export interface ReviewedWord {
  word: string;
  correct: boolean;
}

/** Cập nhật lịch ôn sau 1 lượt luyện tập (đúng/sai từng từ) */
export async function recordReviews(userId: string, reviewed: ReviewedWord[], now = new Date()): Promise<void> {
  // 1 từ xuất hiện nhiều lần trong lượt: chỉ cần sai 1 lần là tính sai
  const outcome = new Map<string, boolean>();
  for (const { word, correct } of reviewed) {
    const key = wordKey(word);
    if (key) outcome.set(key, (outcome.get(key) ?? true) && correct);
  }
  if (outcome.size === 0) return;

  const existing = await prisma.wordReview.findMany({
    where: { userId, word: { in: [...outcome.keys()] } },
    select: { word: true, intervalDays: true, dueAt: true },
  });
  const byWord = new Map(existing.map((r) => [r.word, r]));

  const writes: Prisma.PrismaPromise<unknown>[] = [];
  for (const [word, correct] of outcome) {
    const current = byWord.get(word);
    let next: { intervalDays: number; dueAt: Date } | null = null;
    if (!correct) next = { intervalDays: 1, dueAt: dueDateAfter(1, now) };
    else if (!current?.dueAt || current.dueAt <= now) {
      const interval = nextInterval(current?.intervalDays ?? 0);
      next = { intervalDays: interval, dueAt: dueDateAfter(interval, now) };
    }
    if (!next) continue;
    writes.push(
      prisma.wordReview.upsert({
        where: { userId_word: { userId, word } },
        create: { userId, word, ...next },
        update: next,
      }),
    );
  }
  if (writes.length > 0) await prisma.$transaction(writes);
}
