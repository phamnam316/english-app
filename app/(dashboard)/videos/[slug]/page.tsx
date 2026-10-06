"use client";

import { useParams } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoLesson } from "@/components/video/video-lesson";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api-client";

export default function VideoPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, error, isLoading, refetch } = useApiQuery((signal) => api.getVideo(slug, signal), [slug], {
    cacheKey: `video:${slug}`,
  });

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1180px] px-4 pt-6 pb-28 sm:px-8 sm:pt-8 md:pb-20">
        {isLoading ? (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12" aria-busy="true" aria-label="Đang tải video">
            <div className="space-y-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-36 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState
            title="Không mở được video"
            error={error}
            onRetry={error.status === 404 ? undefined : refetch}
            backHref="/videos"
            backLabel="Về danh sách video"
          />
        ) : data ? (
          <VideoLesson clip={data.clip} vocabulary={data.vocabulary} canEdit={data.canEdit} />
        ) : null}
      </main>
    </>
  );
}
