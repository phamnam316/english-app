"use client";

import Link from "next/link";
import { Captions, SlidersHorizontal } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api-client";
import { youtubeThumbnail } from "@/lib/videos/catalog";
import { formatClock } from "@/lib/videos/subtitles";
import type { VideoClipSummary } from "@/types/video";

export default function VideosPage() {
  const { data, error, isLoading, refetch } = useApiQuery((signal) => api.getVideos(signal), [], { cacheKey: "videos" });

  // Clip đã có phụ đề lên trước, giữ nguyên thứ tự trong danh sách gốc
  const clips = [...(data?.clips ?? [])].sort((a, b) => Number(b.cueCount > 0) - Number(a.cueCount > 0));

  return (
    <>
      <AppHeader />

      <main className="mx-auto w-full max-w-[1180px] px-4 pt-8 pb-28 sm:px-8 sm:pt-12 md:pb-20">
        <h1 className="text-[2.5rem] leading-[1.08] tracking-[-0.015em] sm:text-[3.25rem]">Xem phim</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Học tiếng Anh qua các clip ngắn của We Bare Bears: phụ đề song ngữ Anh – Việt, bấm vào từ để tra nghĩa, phát lại
          từng câu và tự dừng sau mỗi câu để luyện nghe.
        </p>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Đang tải danh sách video">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <ErrorState title="Không tải được danh sách video" error={error} onRetry={refetch} />
          ) : (
            <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {clips.map((clip) => (
                <li key={clip.slug}>
                  <ClipCard clip={clip} canEdit={data?.canEdit ?? false} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-12 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          Video được nhúng từ kênh YouTube chính thức của We Bare Bears (Cartoon Network) và phát bằng trình phát của YouTube.
        </p>
      </main>
    </>
  );
}

function ClipCard({ clip, canEdit }: { clip: VideoClipSummary; canEdit: boolean }) {
  const hasSubtitles = clip.cueCount > 0;

  return (
    <article className="group relative">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-panel">
        {/* Ảnh thu nhỏ của YouTube: dùng thẻ img thường, không qua tối ưu ảnh của Next.js (khỏi khai báo remotePatterns) */}
        <img
          src={youtubeThumbnail(clip.youtubeId)}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute right-2 bottom-2 rounded-sm bg-black/75 px-1.5 py-0.5 text-[12px] font-medium text-white tabular-nums">
          {formatClock(clip.durationSec)}
        </span>
      </div>

      <h2 className="mt-3 font-serif text-[1.35rem] leading-snug">
        <Link
          href={`/videos/${clip.slug}`}
          className="outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:underline group-hover:underline group-hover:decoration-clay group-hover:decoration-2 group-hover:underline-offset-4"
        >
          {clip.title}
        </Link>
      </h2>
      <p className="mt-0.5 text-[13px] text-muted-foreground">{clip.episode}</p>
      <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed">{clip.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
        {hasSubtitles ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-moss-strong">
            <Captions aria-hidden className="size-4" />
            Phụ đề Anh – Việt · {clip.cueCount} câu
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Captions aria-hidden className="size-4" />
            Chưa có phụ đề song ngữ
          </span>
        )}
        {canEdit && (
          <Link
            href={`/videos/${clip.slug}/studio`}
            className="relative z-10 inline-flex items-center gap-1 font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <SlidersHorizontal aria-hidden className="size-3.5" />
            Căn phụ đề
          </Link>
        )}
      </div>
    </article>
  );
}
