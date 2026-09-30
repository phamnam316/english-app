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
  /** Độ dài 1 lượt chơi, hiện trên thẻ trò chơi */
  length: string;
  /** Tính giờ 60 giây: điểm = số câu đúng trong thời gian đó (có kỷ lục) */
  timed: boolean;
  tileClass: string;
  rules: string[];
}

export const PRACTICE_MODES: PracticeModeMeta[] = [
  {
    mode: "MATCH",
    slug: "match",
    title: "Ghép cặp",
    description: "Nối từ tiếng Anh với nghĩa tiếng Việt càng nhanh càng tốt.",
    length: "60 giây",
    timed: true,
    tileClass: "bg-tile-mint",
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
    length: "60 giây",
    timed: true,
    tileClass: "bg-tile-yellow",
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
    length: "8 từ",
    timed: false,
    tileClass: "bg-tile-blue",
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
    length: "6 câu",
    timed: false,
    tileClass: "bg-tile-peach",
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
    length: "6 từ",
    timed: false,
    tileClass: "bg-tile-pink",
    rules: [
      "Bấm Nghe mẫu để nghe cách đọc.",
      "Bấm micro rồi đọc to, rõ từ trên màn hình. Mỗi từ có 3 lần thử.",
      "Cần trình duyệt Chrome hoặc Edge và cho phép dùng micro.",
    ],
  },
];

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

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function numberToWords(n: number): string {
  if (n < 20) return ONES[n];
  const ones = n % 10;
  return ones ? `${TENS[Math.floor(n / 10)]} ${ONES[ones]}` : TENS[Math.floor(n / 10)];
}

/**
 * Chuẩn hóa câu nói nhận dạng được để so với đáp án: chữ thường, bỏ dấu câu,
 * đổi số thành chữ (máy nhận dạng hay trả "20" thay vì "twenty").
 */
export function normalizeSpoken(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\d+/g, (digits) => {
      const n = Number(digits);
      return n < 100 ? numberToWords(n) : digits;
    })
    .replace(/-/g, " ")
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Đúng nếu 1 trong các cách nhận dạng khớp đáp án, hoặc có chứa trọn cụm đáp án ("uh hello" vẫn tính "hello") */
export function isSpokenMatch(transcripts: string[], target: string): boolean {
  const goal = normalizeSpoken(target);
  if (!goal) return false;
  return transcripts.some((transcript) => {
    const said = normalizeSpoken(transcript);
    return said === goal || ` ${said} `.includes(` ${goal} `);
  });
}
