import { requireSessionUser } from "@/lib/auth";
import { ApiError, handleApiError, parseJsonBody } from "@/lib/api-error";
import { textToSpeechSchema } from "@/lib/validations";

/**
 * POST /api/ai/tts
 * Body: { text, voice?, speed? } -> audio/mpeg
 *
 * Cần OPENAI_API_KEY. Không có key thì trả 503: frontend (hooks/use-speech.ts) tự chuyển
 * sang giọng đọc có sẵn của trình duyệt.
 */
export async function POST(request: Request) {
  try {
    await requireSessionUser();

    const body = await parseJsonBody(request);
    const { text, voice, speed } = textToSpeechSchema.parse(body);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ApiError(503, "TTS_UNAVAILABLE", "Chức năng đọc phát âm chưa được cấu hình.");
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini-tts", voice, input: text, speed, response_format: "mp3" }),
    });

    if (!response.ok || !response.body) {
      console.error("[POST /api/ai/tts] OpenAI", response.status, await response.text().catch(() => ""));
      throw new ApiError(502, "TTS_FAILED", "Không tạo được âm thanh. Thử lại sau.");
    }

    return new Response(response.body, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
    });
  } catch (error) {
    return handleApiError(error, "POST /api/ai/tts");
  }
}
