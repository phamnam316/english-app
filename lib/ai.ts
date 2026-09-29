/**
 * Kiểu dữ liệu kết quả AI (sửa ngữ pháp, hội thoại). Các API /api/ai/correct-grammar và
 * /api/ai/chat chưa có trong bản frontend này, file chỉ giữ phần type mà types/api.ts cần.
 */

export interface GrammarIssue {
  /** Đoạn sai trong câu gốc */
  original: string;
  /** Cách sửa */
  suggestion: string;
  /** Giải thích bằng tiếng Việt */
  explanation: string;
}

export interface GrammarCorrection {
  /** Câu đã sửa hoàn chỉnh */
  correctedText: string;
  isCorrect: boolean;
  issues: GrammarIssue[];
}

export interface ChatFeedback {
  /** Câu user viết đã được sửa; null nếu câu đã đúng */
  correctedMessage: string | null;
  /** Nhận xét ngắn bằng tiếng Việt */
  comment: string | null;
}
