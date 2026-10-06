import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { wordLookupSchema } from "@/lib/videos/validations";
import type { WordLookupResponse } from "@/types/video";

const isConsonant = (char: string | undefined) => !!char && /[bcdfghjklmnpqrstvwxz]/.test(char);

/**
 * Các dạng gốc có thể có của 1 từ trong câu thoại, ưu tiên theo thứ tự:
 * "bears" -> bear, "tried" -> try, "making" -> make, "stopped" -> stop, "Grizz's" -> grizz.
 * Không cần đúng ngữ pháp tuyệt đối: dạng sai đơn giản là không khớp từ nào trong bảng Vocabulary.
 */
function wordCandidates(word: string): string[] {
  const base = word.replace(/'s$/, "");
  const candidates = [word, base];
  const stems = (suffix: string) => (base.endsWith(suffix) ? base.slice(0, -suffix.length) : null);

  const ies = stems("ies");
  if (ies) candidates.push(`${ies}y`);
  const es = stems("es");
  if (es) candidates.push(es);
  const s = stems("s");
  if (s && !base.endsWith("ss")) candidates.push(s);

  const ied = stems("ied");
  if (ied) candidates.push(`${ied}y`);
  for (const suffix of ["ed", "ing"]) {
    const stem = stems(suffix);
    if (!stem || stem.length < 2) continue;
    candidates.push(stem, `${stem}e`);
    // Phụ âm cuối gấp đôi: stopped -> stop, running -> run
    if (stem.at(-1) === stem.at(-2) && isConsonant(stem.at(-1))) candidates.push(stem.slice(0, -1));
  }

  return [...new Set(candidates.filter((c) => c.length > 0))];
}

/**
 * GET /api/words/lookup?q=<từ>
 * Tra nghĩa 1 từ (người xem bấm vào từ trong phụ đề) trong bộ từ vựng của các khóa đã publish.
 */
export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { q } = wordLookupSchema.parse({ q: new URL(request.url).searchParams.get("q") ?? undefined });
    const candidates = wordCandidates(q);

    const rows = await prisma.vocabulary.findMany({
      where: {
        OR: candidates.map((candidate) => ({ word: { equals: candidate, mode: "insensitive" as const } })),
        lesson: { unit: { course: { isPublished: true } } },
      },
      select: { word: true, phonetic: true, meaning: true, exampleSentence: true, exampleTranslation: true },
      take: 20,
    });

    const rank = (word: string) => candidates.indexOf(word.toLowerCase());
    const best = rows.sort((a, b) => rank(a.word) - rank(b.word) || Number(!a.exampleSentence) - Number(!b.exampleSentence))[0];

    return NextResponse.json<WordLookupResponse>(
      { entry: best ?? null },
      { headers: { "Cache-Control": "private, max-age=3600" } },
    );
  } catch (error) {
    return handleApiError(error, "GET /api/words/lookup");
  }
}
