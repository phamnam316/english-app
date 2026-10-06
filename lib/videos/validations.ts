import { z } from "zod";

/** Giây trong video, làm tròn 0,01 giây; null = chưa căn */
const secondsSchema = z
  .number({ error: "Thời gian phải là số giây." })
  .min(0, "Thời gian không được âm.")
  .max(6 * 60 * 60, "Thời gian vượt quá độ dài video.")
  .transform((value) => Math.round(value * 100) / 100)
  .nullable();

export const subtitleLineSchema = z
  .object({
    speaker: z.string().trim().max(40, "Tên người nói tối đa 40 ký tự.").default(""),
    en: z
      .string({ error: "Câu tiếng Anh là bắt buộc." })
      .trim()
      .min(1, "Câu tiếng Anh không được để trống.")
      .max(300, "Mỗi câu tối đa 300 ký tự."),
    vi: z.string().trim().max(400, "Bản dịch tối đa 400 ký tự.").default(""),
    start: secondsSchema,
    end: secondsSchema,
  })
  // Giờ kết thúc chỉ có nghĩa khi sau giờ bắt đầu
  .transform((line) => ({
    ...line,
    end: line.start !== null && line.end !== null && line.end > line.start ? line.end : null,
  }));

export const saveSubtitlesSchema = z.object({
  lines: z.array(subtitleLineSchema, { error: "lines phải là mảng câu." }).max(600, "Tối đa 600 câu mỗi clip."),
});

/** Số câu tối đa mỗi lần dịch tự động: trang căn phụ đề tự chia lời thoại dài thành nhiều lần gọi */
export const TRANSLATE_BATCH_SIZE = 60;

export const translateLinesSchema = z.object({
  lines: z
    .array(z.string().trim().min(1, "Câu cần dịch không được để trống.").max(300, "Mỗi câu tối đa 300 ký tự."), {
      error: "lines phải là mảng câu.",
    })
    .min(1, "Cần ít nhất 1 câu để dịch.")
    .max(TRANSLATE_BATCH_SIZE, `Tối đa ${TRANSLATE_BATCH_SIZE} câu mỗi lần dịch.`),
});

export const wordLookupSchema = z.object({
  q: z
    .string({ error: "Thiếu từ cần tra." })
    .trim()
    .min(1, "Thiếu từ cần tra.")
    .max(60, "Từ quá dài.")
    .transform((value) => value.toLowerCase().replace(/[’`]/g, "'")),
});
