import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { wordLookupSchema } from "@/lib/videos/validations";
import { lookupWord } from "@/lib/videos/vocabulary";
import type { WordLookupResponse } from "@/types/video";

/**
 * GET /api/words/lookup?q=<từ>
 * Tra nghĩa 1 từ (người học bấm / rê chuột vào từ trong phụ đề) trong bộ từ vựng của các khóa đã publish,
 * kèm mức nhớ người học đã chọn cho từ đó.
 */
export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { q } = wordLookupSchema.parse({ q: new URL(request.url).searchParams.get("q") ?? undefined });
    return NextResponse.json<WordLookupResponse>(await lookupWord(user.id, q), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/words/lookup");
  }
}
