"use client";

import { useParams } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SubtitleStudio } from "@/components/video/subtitle-studio";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api-client";

/** Trang căn phụ đề của 1 clip (chỉ ADMIN). Không dùng dữ liệu lưu tạm: luôn mở bản mới nhất trên máy chủ */
export default function VideoStudioPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, error, isLoading, refetch } = useApiQuery((signal) => api.getVideo(slug, signal), [slug]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1400px] px-4 pt-6 pb-28 sm:px-8 sm:pt-8 md:pb-20">
        {isLoading ? (
          <div className="grid gap-10 lg:grid-cols-[26rem_minmax(0,1fr)]" aria-busy="true" aria-label="Đang tải trang căn phụ đề">
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState
            title="Không mở được trang căn phụ đề"
            error={error}
            onRetry={error.status === 404 ? undefined : refetch}
            backHref="/videos"
            backLabel="Về danh sách video"
          />
        ) : data && !data.canEdit ? (
          <ErrorState
            title="Chỉ quản trị viên được căn phụ đề"
            description="Tài khoản của bạn chưa có quyền quản trị. Bạn vẫn xem được video và phụ đề đã có."
            backHref={`/videos/${slug}`}
            backLabel="Về trang xem video"
          />
        ) : data ? (
          <SubtitleStudio key={data.clip.slug} clip={data.clip} />
        ) : null}
      </main>
    </>
  );
}
