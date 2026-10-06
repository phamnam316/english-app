import type { Level, QuizType } from "@prisma/client";

/** Tên hiển thị của ứng dụng: đổi tại đây là đổi toàn bộ giao diện */
export const APP_NAME = "English App";

interface LevelMeta {
  label: string;
  /** Khung năng lực CEFR tương ứng */
  cefr: string;
}

export const LEVEL_META: Record<Level, LevelMeta> = {
  BEGINNER: {
    label: "Mới bắt đầu",
    cefr: "A1–A2",
  },
  INTERMEDIATE: {
    label: "Trung cấp",
    cefr: "B1–B2",
  },
  ADVANCED: {
    label: "Nâng cao",
    cefr: "C1–C2",
  },
};


export const QUIZ_TYPE_LABEL: Record<QuizType, string> = {
  MULTIPLE_CHOICE: "Chọn đáp án đúng",
  FILL_IN_BLANK: "Điền vào chỗ trống",
  LISTENING: "Nghe và trả lời",
  SPEAKING: "Nói hoặc viết câu",
  WORD_ORDER: "Sắp xếp thành câu",
};

const PRAISES = ["Chính xác!", "Tuyệt vời!", "Giỏi lắm!", "Rất tốt!", "Hoàn hảo!"];

/** Lời khen theo thứ tự câu hỏi (không dùng Math.random để server/client render giống nhau) */
export function praiseFor(index: number): string {
  return PRAISES[index % PRAISES.length];
}
