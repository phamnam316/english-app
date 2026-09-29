import { z } from "zod";

/** Chuẩn hóa email (bỏ khoảng trắng, chữ thường) trước khi kiểm tra định dạng */
const emailSchema = z
  .string({ error: "Email là bắt buộc." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Email không đúng định dạng."));

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên không được để trống.")
    .max(100, "Tên tối đa 100 ký tự.")
    .optional(),
  email: emailSchema,
  password: z
    .string({ error: "Mật khẩu là bắt buộc." })
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự.")
    // bcrypt chỉ dùng 72 byte đầu tiên; phần sau bị bỏ qua âm thầm nên chặn luôn
    .refine((value) => new TextEncoder().encode(value).length <= 72, {
      error: "Mật khẩu quá dài (tối đa 72 byte).",
    }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Nộp bài
// ---------------------------------------------------------------------------

export const submitLessonSchema = z
  .object({
    answers: z
      .array(
        z.object({
          quizId: z.string({ error: "quizId là bắt buộc." }).min(1, "quizId không được để trống."),
          selectedOption: z
            .string({ error: "selectedOption phải là chuỗi." })
            .max(500, "Câu trả lời quá dài."),
        }),
        { error: "answers phải là một mảng." },
      )
      .min(1, "Cần gửi ít nhất 1 câu trả lời.")
      .max(200, "Số câu trả lời vượt quá giới hạn."),
  })
  .refine(
    (data) => new Set(data.answers.map((a) => a.quizId)).size === data.answers.length,
    { error: "Mỗi câu hỏi chỉ được trả lời một lần.", path: ["answers"] },
  );

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SubmitLessonInput = z.infer<typeof submitLessonSchema>;

/** Kiểm tra 1 câu ngay khi user bấm "Kiểm tra" (không lưu tiến độ) */
export const checkAnswerSchema = z.object({
  quizId: z.string({ error: "quizId là bắt buộc." }).min(1, "quizId không được để trống."),
  answer: z
    .string({ error: "answer phải là chuỗi." })
    .trim()
    .min(1, "Bạn chưa chọn hoặc nhập câu trả lời.")
    .max(500, "Câu trả lời quá dài."),
});

export type CheckAnswerInput = z.infer<typeof checkAnswerSchema>;

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export const correctGrammarSchema = z.object({
  text: z
    .string({ error: "text là bắt buộc." })
    .trim()
    .min(1, "Vui lòng nhập câu tiếng Anh cần kiểm tra.")
    .max(2000, "Văn bản tối đa 2000 ký tự."),
  context: z.string().trim().max(500, "Ngữ cảnh tối đa 500 ký tự.").optional(),
});

export const aiChatSchema = z.object({
  sessionId: z.string().trim().min(1, "sessionId không hợp lệ.").optional(),
  topic: z
    .string({ error: "topic là bắt buộc." })
    .trim()
    .min(1, "Vui lòng chọn chủ đề trò chuyện.")
    .max(200, "Chủ đề tối đa 200 ký tự."),
  userMessage: z
    .string({ error: "userMessage là bắt buộc." })
    .trim()
    .min(1, "Tin nhắn không được để trống.")
    .max(1000, "Tin nhắn tối đa 1000 ký tự."),
  level: z.enum(LEVELS, { error: "level phải là BEGINNER, INTERMEDIATE hoặc ADVANCED." }),
});

export const TTS_VOICES = ["alloy", "echo"] as const;

export const textToSpeechSchema = z.object({
  text: z
    .string({ error: "text là bắt buộc." })
    .trim()
    .min(1, "Vui lòng nhập nội dung cần đọc.")
    .max(1000, "Nội dung tối đa 1000 ký tự."),
  voice: z.enum(TTS_VOICES, { error: "voice phải là alloy hoặc echo." }).default("alloy"),
  /** 0.75 = đọc chậm cho người mới, 1 = tốc độ bình thường */
  speed: z
    .number({ error: "speed phải là số." })
    .min(0.5, "speed tối thiểu 0.5.")
    .max(1.5, "speed tối đa 1.5.")
    .default(1),
});

export type CorrectGrammarInput = z.infer<typeof correctGrammarSchema>;
export type AIChatInput = z.infer<typeof aiChatSchema>;
export type TextToSpeechInput = z.input<typeof textToSpeechSchema>;
