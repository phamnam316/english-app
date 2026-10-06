import { prisma } from "@/lib/prisma";
import { VIDEO_CATALOG, wikiTranscriptUrl, type CatalogClip } from "@/lib/videos/catalog";
import { countCues } from "@/lib/videos/subtitles";
import type { SubtitleLine, VideoClipDetail, VideoClipSummary } from "@/types/video";

/** Cột lines là Json: chỉ giữ các câu đúng dạng (dữ liệu sửa tay trong DB cũng không làm vỡ trang) */
export function toSubtitleLines(value: unknown): SubtitleLine[] {
  if (!Array.isArray(value)) return [];
  const numberOrNull = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

  return value.flatMap((item): SubtitleLine[] => {
    if (!item || typeof item !== "object") return [];
    const line = item as Record<string, unknown>;
    if (typeof line.en !== "string" || !line.en.trim()) return [];
    return [
      {
        speaker: typeof line.speaker === "string" ? line.speaker : "",
        en: line.en,
        vi: typeof line.vi === "string" ? line.vi : "",
        start: numberOrNull(line.start),
        end: numberOrNull(line.end),
      },
    ];
  });
}

function toSummary(clip: CatalogClip, lines: SubtitleLine[]): VideoClipSummary {
  return {
    slug: clip.slug,
    youtubeId: clip.youtubeId,
    title: clip.title,
    originalTitle: clip.originalTitle,
    series: clip.series,
    episode: clip.episode,
    summary: clip.summary,
    durationSec: clip.durationSec,
    cueCount: countCues(lines),
  };
}

export async function getVideoSummaries(): Promise<VideoClipSummary[]> {
  const rows = await prisma.videoSubtitle.findMany({ select: { clipSlug: true, lines: true } });
  const linesBySlug = new Map(rows.map((row) => [row.clipSlug, toSubtitleLines(row.lines)]));
  return VIDEO_CATALOG.map((clip) => toSummary(clip, linesBySlug.get(clip.slug) ?? []));
}

export async function getVideoDetail(clip: CatalogClip): Promise<VideoClipDetail> {
  const row = await prisma.videoSubtitle.findUnique({
    where: { clipSlug: clip.slug },
    select: { lines: true, updatedAt: true },
  });
  const lines = toSubtitleLines(row?.lines);

  return {
    ...toSummary(clip, lines),
    startSec: clip.startSec ?? null,
    endSec: clip.endSec ?? null,
    lines,
    transcriptUrl: wikiTranscriptUrl(clip.wikiPage),
    updatedAt: row?.updatedAt.toISOString() ?? null,
  };
}
