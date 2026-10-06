/**
 * Trang Luyện tập: danh sách trò chơi, quy tắc XP và các hàm xử lý từ/câu dùng chung cho client và server.
 */
import type { PracticeMode } from "@prisma/client";

/** Mỗi câu đúng 1 XP, tối đa 10 XP mỗi lượt */
export const PRACTICE_MAX_XP_PER_ROUND = 10;
/** Tổng XP từ luyện tập mỗi ngày: đủ để thưởng người chăm, không lấn át XP của bài học */
export const PRACTICE_DAILY_XP_CAP = 50;
/** Cần ít nhất 4 từ để tạo được câu hỏi 4 lựa chọn */
export const PRACTICE_MIN_WORDS = 4;
export const TIMED_ROUND_SECONDS = 60;

export interface PracticeModeMeta {
  mode: PracticeMode;
  /** Đường dẫn: /practice/<slug> */
  slug: string;
  title: string;
  description: string;
  /** Mô tả 1 dòng trong danh sách Ôn lại (trang chủ, trang Luyện tập) */
  summary: string;
  /** Độ dài 1 lượt chơi, hiện trên thẻ trò chơi */
  length: string;
  /** Tính giờ 60 giây: điểm = số câu đúng trong thời gian đó (có kỷ lục) */
  timed: boolean;
  rules: string[];
}

export const PRACTICE_MODES: PracticeModeMeta[] = [
  {
    mode: "MATCH",
    slug: "match",
    title: "Ghép cặp",
    description: "Nối từ tiếng Anh với nghĩa tiếng Việt càng nhanh càng tốt.",
    summary: "Nối từ tiếng Anh với nghĩa tiếng Việt",
    length: "60 giây",
    timed: true,
    rules: [
      "Chạm 1 từ tiếng Anh rồi chạm nghĩa đúng của nó.",
      "Ghép hết bảng sẽ có bảng mới. Ghép được càng nhiều cặp trong 60 giây càng tốt.",
      "Chạm vào từ tiếng Anh để nghe phát âm.",
    ],
  },
  {
    mode: "SPEED",
    slug: "speed",
    title: "Thử thách 60 giây",
    description: "Chọn nghĩa đúng thật nhanh, đúng liên tiếp để lên combo.",
    summary: "Chọn nghĩa đúng, đúng liên tiếp để lên combo",
    length: "60 giây",
    timed: true,
    rules: [
      "Mỗi câu có 4 lựa chọn, chọn đáp án đúng nhanh nhất có thể.",
      "Đúng liên tiếp từ 3 câu trở lên sẽ được combo.",
      "Máy tính: bấm phím 1–4 để chọn.",
    ],
  },
  {
    mode: "DICTATION",
    slug: "dictation",
    title: "Nghe & viết",
    description: "Nghe máy đọc từ rồi gõ lại cho đúng chính tả.",
    summary: "Nghe máy đọc rồi gõ lại đúng chính tả",
    length: "8 từ",
    timed: false,
    rules: [
      "Bấm loa để nghe (có thể nghe lại hoặc nghe chậm).",
      "Gõ lại từ vừa nghe rồi bấm Kiểm tra.",
      "Bí quá thì bấm Gợi ý để xem nghĩa và chữ cái đầu.",
    ],
  },
  {
    mode: "SENTENCE",
    slug: "sentence",
    title: "Xếp câu",
    description: "Nghe câu ví dụ rồi sắp xếp các thẻ từ theo đúng thứ tự.",
    summary: "Sắp thẻ từ theo câu ví dụ vừa nghe",
    length: "6 câu",
    timed: false,
    rules: [
      "Nghe câu, sau đó chạm các thẻ từ theo đúng thứ tự.",
      "Chạm lại thẻ trong câu để bỏ ra.",
      "Câu lấy từ ví dụ của các từ bạn đã học.",
    ],
  },
  {
    mode: "PRONUNCIATION",
    slug: "speak",
    title: "Luyện phát âm",
    description: "Nói vào micro, app nhận dạng xem bạn phát âm đúng chưa.",
    summary: "Đọc to vào micro, mỗi từ 3 lần thử",
    length: "6 từ",
    timed: false,
    rules: [
      "Bấm Nghe mẫu để nghe cách đọc.",
      "Bấm micro rồi đọc to, rõ từ trên màn hình. Mỗi từ có 3 lần thử.",
      "Cần trình duyệt Chrome hoặc Edge và cho phép dùng micro.",
    ],
  },
];

/** Đường dẫn /practice/quick: "Ôn nhanh 2 phút", web tự chọn trò và ưu tiên từ đến hạn ôn */
export const QUICK_REVIEW_SLUG = "quick";

export function getPracticeMode(slug: string): PracticeModeMeta | null {
  return PRACTICE_MODES.find((m) => m.slug === slug) ?? null;
}

/** XP của 1 lượt (chưa tính giới hạn mỗi ngày) */
export function practiceXp(correct: number): number {
  return Math.min(PRACTICE_MAX_XP_PER_ROUND, Math.max(0, Math.floor(correct)));
}

/** Trộn ngẫu nhiên (Fisher–Yates). Chỉ gọi ở trình duyệt, sau khi dữ liệu đã tải */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Trọng số chọn từ theo mức nhớ tự đánh giá: từ chưa nhớ hay gặp lại, từ đã nhớ ít gặp hơn */
const RATING_WEIGHT: Record<number, number> = { 1: 4, 2: 2.5, 3: 0.6 };
const UNRATED_WEIGHT = 1.5;

/** Từ đến hạn ôn được ưu tiên gấp mấy lần */
const DUE_WEIGHT = 3;

/**
 * Trộn có ưu tiên (thuật toán Efraimidis–Spirakis): từ có trọng số cao thường đứng trước,
 * nhưng thứ tự vẫn ngẫu nhiên. Dùng thay shuffle() khi chọn từ cho 1 lượt chơi.
 */
export function weightedShuffle<T extends { rating: number | null; due?: boolean }>(items: readonly T[]): T[] {
  return items
    .map((item) => {
      const base = item.rating === null ? UNRATED_WEIGHT : (RATING_WEIGHT[item.rating] ?? UNRATED_WEIGHT);
      const weight = item.due ? base * DUE_WEIGHT : base;
      return { item, key: Math.random() ** (1 / weight) };
    })
    .sort((a, b) => b.key - a.key)
    .map(({ item }) => item);
}

/**
 * Tách câu thành các thẻ từ, bỏ dấu câu ở đầu/cuối mỗi từ nhưng giữ dấu nháy bên trong
 * (don't, o'clock): "Hello, I am Lan." -> ["Hello", "I", "am", "Lan"].
 */
export function tokenizeSentence(sentence: string): string[] {
  return sentence
    .replace(/[‘’]/g, "'")
    .split(/\s+/)
    .map((token) => token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);
}

/** So khớp 2 dãy từ, không phân biệt hoa/thường */
export function sameTokens(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((token, i) => token.toLowerCase() === b[i].toLowerCase());
}
