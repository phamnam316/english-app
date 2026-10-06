import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { ApiError, handleApiError, parseJsonBody } from "@/lib/api-error";
import { translateLinesSchema } from "@/lib/videos/validations";
import type { TranslateLinesResponse } from "@/types/video";

/** Đổi model bằng biến môi trường OPENAI_TRANSLATE_MODEL nếu model mặc định không còn được hỗ trợ */
const DEFAULT_MODEL = "gpt-4.1-mini";

const SYSTEM_PROMPT = [
  "You translate English subtitle lines from the cartoon We Bare Bears into Vietnamese for Vietnamese learners of English.",
  "Translate each line naturally and concisely, as spoken Vietnamese subtitles, staying close to the English meaning so learners can match the two.",
  "Keep character names untranslated (Grizz/Grizzly, Panda, Ice Bear, Chloe, Charlie, Nom Nom...).",
  "Ice Bear always speaks about himself in the third person: keep that (e.g. 'Ice Bear agrees' -> 'Ice Bear đồng ý').",
  'Return JSON {"translations": [...]} with exactly one Vietnamese string per input line, in the same order.',
].join(" ");

/**
 * POST /api/videos/translate
 * Body: { lines: string[] } -> { translations: string[] } (cùng thứ tự). Chỉ ADMIN, dùng ở trang căn phụ đề.
 * Cần OPENAI_API_KEY; không có key thì trả 503 và người căn phụ đề tự gõ bản dịch.
 */
export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (user.role !== "ADMIN") {
      throw new ApiError(403, "FORBIDDEN", "Chỉ quản trị viên được dùng dịch tự động.");
    }

    const { lines } = translateLinesSchema.parse(await parseJsonBody(request));

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ApiError(503, "TRANSLATE_UNAVAILABLE", "Dịch tự động chưa được cấu hình (thiếu OPENAI_API_KEY).");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_TRANSLATE_MODEL || DEFAULT_MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify({ lines }) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "subtitle_translations",
            strict: true,
            schema: {
              type: "object",
              properties: { translations: { type: "array", items: { type: "string" } } },
              required: ["translations"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      console.error("[POST /api/videos/translate] OpenAI", response.status, await response.text().catch(() => ""));
      throw new ApiError(502, "TRANSLATE_FAILED", "Không dịch được lúc này. Thử lại sau.");
    }

    const completion = (await response.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
    let translations: unknown;
    try {
      translations = (JSON.parse(completion.choices?.[0]?.message?.content ?? "") as { translations?: unknown })
        .translations;
    } catch {
      translations = undefined;
    }

    if (
      !Array.isArray(translations) ||
      translations.length !== lines.length ||
      !translations.every((t) => typeof t === "string")
    ) {
      throw new ApiError(502, "TRANSLATE_FAILED", "Bản dịch trả về không khớp số câu. Thử lại.");
    }

    return NextResponse.json<TranslateLinesResponse>({ translations: translations.map((t: string) => t.trim()) });
  } catch (error) {
    return handleApiError(error, "POST /api/videos/translate");
  }
}
