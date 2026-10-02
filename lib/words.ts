import { prisma } from "@/lib/prisma";
import { isWordRating, wordKey } from "@/lib/word-rating";
import type { WordRating } from "@/types/api";

/** Mức nhớ của user cho các từ cho trước (hoặc mọi từ nếu không truyền `words`), theo wordKey() */
export async function getWordRatings(userId: string, words?: string[]): Promise<Map<string, WordRating>> {
  const keys = words ? [...new Set(words.map(wordKey))] : undefined;
  if (keys && keys.length === 0) return new Map();
  const rows = await prisma.wordReview.findMany({
    where: { userId, ...(keys && { word: { in: keys } }) },
    select: { word: true, rating: true },
  });
  const ratings = new Map<string, WordRating>();
  for (const row of rows) if (isWordRating(row.rating)) ratings.set(row.word, row.rating);
  return ratings;
}
