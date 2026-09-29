import type { Level, QuizType } from "@prisma/client";

/** Kiểu dữ liệu nội dung khóa học dùng cho prisma/seed.ts */

export interface SeedVocab {
  word: string;
  phonetic?: string;
  meaning: string;
  example?: string;
}

export interface SeedExercise {
  question: string;
  type: QuizType;
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface SeedLesson {
  title: string;
  /** Mặc định 10 XP */
  xp?: number;
  vocab: SeedVocab[];
  exercises: SeedExercise[];
}

export interface SeedUnit {
  title: string;
  lessons: SeedLesson[];
}

export interface SeedCourse {
  title: string;
  description: string;
  level: Level;
  isPublished: boolean;
  units: SeedUnit[];
}

// ---------------------------------------------------------------------------
// Hàm tạo dữ liệu ngắn gọn
// ---------------------------------------------------------------------------

export function v(word: string, phonetic: string, meaning: string, example?: string): SeedVocab {
  return { word, phonetic, meaning, example };
}

/** Băm chuỗi đơn giản, cố định giữa các lần chạy (để xáo đáp án không ngẫu nhiên) */
function hash(text: string): number {
  let h = 0;
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Câu trắc nghiệm. Viết ĐÁP ÁN ĐÚNG Ở VỊ TRÍ ĐẦU TIÊN của `options` cho dễ soát;
 * hàm tự đưa đáp án đúng về một vị trí cố định theo nội dung câu hỏi, để đáp án không luôn là câu 1.
 */
export function mc(question: string, options: string[], explanation?: string): SeedExercise {
  const [answer, ...wrong] = options;
  const position = hash(question) % options.length;
  const shuffled = [...wrong];
  shuffled.splice(position, 0, answer);
  return { question, type: "MULTIPLE_CHOICE", options: shuffled, answer, explanation };
}

/** Câu điền từ: dùng "___" để đánh dấu chỗ trống; đáp án nên là 1 từ duy nhất */
export function fill(question: string, answer: string, explanation?: string): SeedExercise {
  return { question, type: "FILL_IN_BLANK", answer, explanation };
}

/**
 * Câu "viết lại câu bạn sẽ nói". Server so khớp nguyên văn (bỏ qua hoa/thường, dấu câu cuối),
 * nên đề cần nói rõ cách viết (vd "không viết tắt") và đáp án không có dấu phẩy.
 */
export function say(question: string, answer: string, explanation?: string): SeedExercise {
  return { question, type: "SPEAKING", answer, explanation };
}
