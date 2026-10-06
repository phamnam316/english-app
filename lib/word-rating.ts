/**
 * Mức nhớ từ vựng người học tự đánh giá (Chưa nhớ / Hơi nhớ / Đã nhớ).
 * Dùng được ở cả client và server (không gọi DB).
 */
import type { WordRating } from "@/types/api";

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
