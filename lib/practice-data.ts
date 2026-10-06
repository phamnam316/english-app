/**
 * Từ vựng để ôn tập của 1 user (chỉ dùng ở server): từ của các bài đã mở khóa, kèm mức nhớ và trạng thái đến hạn ôn.
 */
import { withLessonStates } from "@/lib/course-progress";
import { prisma } from "@/lib/prisma";
import { isWordRating, wordKey } from "@/lib/word-rating";
import type { CourseSummary, PracticeWord } from "@/types/api";

/** Đủ cho mọi trò chơi mà không gửi quá nhiều dữ liệu */
const MAX_WORDS = 300;

export interface PracticeWords {
  words: PracticeWord[];
  /** Số từ đến hạn ôn hôm nay (tính cả từ bị cắt bớt khỏi `words`) */
  dueCount: number;
}

export async function getPracticeWords(userId: string, courses: CourseSummary[], now = new Date()): Promise<PracticeWords> {
  const lessons = courses.flatMap((course) => withLessonStates(course).flatMap((unit) => unit.lessons));
  const unlockedIds = lessons.filter((l) => l.state !== "locked").map((l) => l.id);
  const completedIds = new Set(lessons.filter((l) => l.state === "completed").map((l) => l.id));

  const [vocabularies, reviews] = await Promise.all([
    prisma.vocabulary.findMany({
      where: { lessonId: { in: unlockedIds } },
      orderBy: [{ lessonId: "asc" }, { order: "asc" }],
      select: {
        id: true,
        word: true,
        phonetic: true,
        meaning: true,
        exampleSentence: true,
        exampleTranslation: true,
        cefr: true,
        audioUrl: true,
        lessonId: true,
      },
    }),
    prisma.wordReview.findMany({ where: { userId }, select: { word: true, rating: true, dueAt: true } }),
  ]);
  const reviewByWord = new Map(reviews.map((r) => [r.word, r]));

  // Cùng 1 từ có thể nằm ở nhiều bài/khóa: chỉ giữ 1 lần
  const byKey = new Map<string, PracticeWord>();
  for (const { lessonId, ...vocab } of vocabularies) {
    const key = wordKey(vocab.word);
    const review = reviewByWord.get(key);
    // Chưa có lịch ôn: từ của bài đã học xong (từ trước khi có lịch ôn) tính là đến hạn
    const due = review?.dueAt ? review.dueAt <= now : completedIds.has(lessonId);
    const existing = byKey.get(key);
    if (existing) {
      if (!review?.dueAt && due) existing.due = true;
      continue;
    }
    const rating = review?.rating;
    byKey.set(key, { ...vocab, rating: isWordRating(rating) ? rating : null, due });
  }

  // Ưu tiên: đến hạn ôn -> chưa nhớ -> hơi nhớ / chưa đánh giá -> đã nhớ
  const priority = (word: PracticeWord) => (word.due ? 0 : 1) * 10 + (word.rating === null ? 2 : word.rating);
  const words = [...byKey.values()].sort((a, b) => priority(a) - priority(b));
  const dueCount = words.filter((w) => w.due).length;
  return { words: words.slice(0, MAX_WORDS), dueCount };
}
