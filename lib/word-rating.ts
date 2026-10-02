/**
 * Mức nhớ từ vựng người học tự đánh giá (Chưa nhớ / Hơi nhớ / Đã nhớ) và ghi chú ngữ pháp của bài học.
 * Dùng được ở cả client và server (không gọi DB).
 */
import type { GrammarNote, WordRating } from "@/types/api";

export const WORD_RATINGS: Array<{ value: WordRating; label: string }> = [
  { value: 1, label: "Chưa nhớ" },
  { value: 2, label: "Hơi nhớ" },
  { value: 3, label: "Đã nhớ" },
];

/** Khóa lưu mức nhớ: chữ thường, bỏ khoảng trắng thừa (cùng 1 từ ở nhiều khóa dùng chung 1 đánh giá) */
export function wordKey(word: string): string {
  return word.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isWordRating(value: unknown): value is WordRating {
  return value === 1 || value === 2 || value === 3;
}

const isString = (value: unknown): value is string => typeof value === "string";

/** Cột grammarNote là Json: kiểm tra đúng dạng trước khi trả cho client */
export function toGrammarNote(value: unknown): GrammarNote | null {
  if (!value || typeof value !== "object") return null;
  const note = value as Record<string, unknown>;
  if (!isString(note.title) || !isString(note.intro)) return null;
  const patterns = Array.isArray(note.patterns) ? note.patterns.filter(isString) : [];
  const examples = Array.isArray(note.examples)
    ? note.examples.filter(
        (e): e is { en: string; vi: string } =>
          !!e && typeof e === "object" && isString((e as { en?: unknown }).en) && isString((e as { vi?: unknown }).vi),
      )
    : [];
  const avoid = note.avoid as { wrong?: unknown; fix?: unknown } | undefined;
  return {
    title: note.title,
    intro: note.intro,
    patterns,
    examples: examples.map(({ en, vi }) => ({ en, vi })),
    avoid: avoid && isString(avoid.wrong) && isString(avoid.fix) ? { wrong: avoid.wrong, fix: avoid.fix } : undefined,
  };
}
