import type { Level, QuizType } from "@prisma/client";

import type { GrammarNote, LessonStory } from "../../types/api";

export type { GrammarNote, LessonStory };

/** Kiểu dữ liệu nội dung khóa học dùng cho prisma/seed.ts */

export interface SeedVocab {
  word: string;
  phonetic?: string;
  meaning: string;
  example?: string;
  /** Bản dịch tiếng Việt của câu ví dụ */
  exampleVi?: string;
  /** Cấp độ CEFR; bỏ trống thì seed tự tra trong bộ từ A1–A2 */
  cefr?: string;
}

export interface SeedExercise {
  question: string;
  type: QuizType;
  options?: string[];
  answer: string;
  explanation?: string;
  /** Bài nghe: câu cho giọng máy đọc */
  audioText?: string;
}

export interface SeedLesson {
  title: string;
  /** Mặc định 10 XP */
  xp?: number;
  /** Đoạn hội thoại tình huống mở đầu bài (đặt từ mới vào ngữ cảnh) */
  story?: LessonStory;
  /** Ghi chú ngữ pháp ("Mẹo ghép câu") hiện giữa phần học từ và phần làm bài */
  grammar?: GrammarNote;
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

export function v(word: string, phonetic: string, meaning: string, example?: string, exampleVi?: string): SeedVocab {
  return { word, phonetic, meaning, example, exampleVi };
}

/** Băm chuỗi đơn giản, cố định giữa các lần chạy (để xáo đáp án không ngẫu nhiên) */
function hash(text: string): number {
  let h = 0;
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h;
}

/** Xáo cố định theo `seed` (cùng nội dung -> cùng thứ tự, seed lại không làm đổi dữ liệu) */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let state = hash(seed) || 1;
  const random = () => {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Đưa đáp án đúng (phần tử đầu) về 1 vị trí cố định theo câu hỏi, để đáp án không luôn là câu 1 */
function placeAnswer(options: string[], key: string): string[] {
  const [answer, ...wrong] = options;
  const shuffled = [...wrong];
  shuffled.splice(hash(key) % options.length, 0, answer);
  return shuffled;
}

/**
 * Câu trắc nghiệm. Viết ĐÁP ÁN ĐÚNG Ở VỊ TRÍ ĐẦU TIÊN của `options` cho dễ soát;
 * hàm tự đưa đáp án đúng về một vị trí cố định theo nội dung câu hỏi.
 */
export function mc(question: string, options: string[], explanation?: string): SeedExercise {
  return { question, type: "MULTIPLE_CHOICE", options: placeAnswer(options, question), answer: options[0], explanation };
}

/** Câu điền từ: dùng "___" để đánh dấu chỗ trống; đáp án nên là 1 từ duy nhất */
export function fill(question: string, answer: string, explanation?: string): SeedExercise {
  return { question, type: "FILL_IN_BLANK", answer, explanation };
}

/**
 * Câu nói/viết (có nút micro). Server so khớp nguyên văn (bỏ qua hoa/thường, dấu câu cuối),
 * nên đề cần nói rõ cách viết (vd "không viết tắt") và đáp án không có dấu phẩy.
 */
export function say(question: string, answer: string, explanation?: string): SeedExercise {
  return { question, type: "SPEAKING", answer, explanation };
}

/**
 * Sắp xếp thẻ từ thành câu. `prompt`: câu tiếng Việt; `answer`: câu tiếng Anh không dấu câu
 * (mỗi từ 1 thẻ); `extra`: thẻ thừa để gây nhiễu (dạng sai hay gặp).
 */
export function order(prompt: string, answer: string, extra: string[] = [], explanation?: string): SeedExercise {
  const words = answer.split(" ");
  const chips = [...words, ...extra];
  let shuffled = seededShuffle(chips, prompt);
  // Không để thẻ xếp sẵn đúng thứ tự ngay từ đầu
  if (shuffled.slice(0, words.length).join(" ") === answer) shuffled = [...shuffled.slice(1), shuffled[0]];
  return { question: prompt, type: "WORD_ORDER", options: shuffled, answer, explanation };
}

/**
 * Bài nghe: máy đọc `audioText`, người học chọn đáp án. Như mc(), đáp án đúng viết ĐẦU TIÊN
 * (thường chính là `audioText`).
 */
export function listen(
  audioText: string,
  options: string[],
  question = "Nghe và chọn từ bạn nghe được",
  explanation?: string,
): SeedExercise {
  return {
    question,
    type: "LISTENING",
    options: placeAnswer(options, audioText),
    answer: options[0],
    explanation,
    audioText,
  };
}
