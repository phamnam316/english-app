import type { Level, QuizType } from "@prisma/client";

/** Tên hiển thị của ứng dụng: đổi tại đây là đổi toàn bộ giao diện */
export const APP_NAME = "English App";

interface LevelMeta {
  label: string;
  /** Khung năng lực CEFR tương ứng */
  cefr: string;
  /** Màu badge cấp độ */
  badgeClass: string;
  /** Màu ô thumbnail pastel của khóa học khi chưa có ảnh */
  tileClass: string;
}

export const LEVEL_META: Record<Level, LevelMeta> = {
  BEGINNER: {
    label: "Beginner",
    cefr: "A1–A2",
    badgeClass: "border-transparent bg-beginner-soft text-beginner",
    tileClass: "bg-tile-mint",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    cefr: "B1–B2",
    badgeClass: "border-transparent bg-intermediate-soft text-intermediate",
    tileClass: "bg-tile-yellow",
  },
  ADVANCED: {
    label: "Advanced",
    cefr: "C1–C2",
    badgeClass: "border-transparent bg-advanced-soft text-advanced",
    tileClass: "bg-tile-salmon",
  },
};

/** Màu ô thumbnail của từng bài trong trang chi tiết khóa học (xoay vòng như thiết kế) */
export const LESSON_TILE_CLASSES = [
  "bg-tile-blue",
  "bg-tile-lavender",
  "bg-tile-peach",
  "bg-tile-mint",
  "bg-tile-pink",
  "bg-tile-yellow",
] as const;

export const QUIZ_TYPE_LABEL: Record<QuizType, string> = {
  MULTIPLE_CHOICE: "Chọn đáp án đúng",
  FILL_IN_BLANK: "Điền vào chỗ trống",
  LISTENING: "Nghe và trả lời",
  SPEAKING: "Viết lại câu bạn sẽ nói",
};

const PRAISES = ["Chính xác!", "Tuyệt vời!", "Giỏi lắm!", "Rất tốt!", "Hoàn hảo!"];

/** Lời khen theo thứ tự câu hỏi (không dùng Math.random để server/client render giống nhau) */
export function praiseFor(index: number): string {
  return PRAISES[index % PRAISES.length];
}
