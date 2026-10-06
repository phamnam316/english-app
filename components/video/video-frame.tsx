"use client";

import { ExternalLink, TriangleAlert } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { youTubeErrorMessage, type useYouTubePlayer } from "@/hooks/use-youtube-player";
import { youtubeWatchUrl } from "@/lib/videos/catalog";

interface VideoFrameProps {
  player: ReturnType<typeof useYouTubePlayer>;
  youtubeId: string;
  title: string;
}

/** Khung 16:9 chứa trình phát YouTube; báo lỗi kèm liên kết mở video trên YouTube khi không phát được */
export function VideoFrame({ player, youtubeId, title }: VideoFrameProps) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-black" aria-label={`Video: ${title}`} role="region">
      <div ref={player.containerRef} className="absolute inset-0 [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:size-full" />
      {player.status === "loading" && <Skeleton aria-hidden className="absolute inset-0 rounded-none" />}
      {player.status === "error" && (
        <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black p-6 text-center text-white">
          <TriangleAlert aria-hidden className="size-7 text-clay" />
          <p className="max-w-sm text-[15px] leading-relaxed">{youTubeErrorMessage(player.errorCode)}</p>
          <a
            href={youtubeWatchUrl(youtubeId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold underline underline-offset-4"
          >
            Mở trên YouTube
            <ExternalLink aria-hidden className="size-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
