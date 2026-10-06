import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PRACTICE_MIN_WORDS, PRACTICE_MODES, QUICK_REVIEW_SLUG } from "@/lib/practice";
import type { HomeResponse } from "@/types/api";

interface ReviewPanelProps {
  review: HomeResponse["review"] | undefined;
  /** Ghi chú về bài ôn tập cuối chương còn khóa, vd "Ôn tập: Làm quen là bài cuối chương 1…" */
  lockNote?: { title: string; text: string } | null;
}

/**
 * Khối "Ôn lại" ở trang chủ: 1 nút "Ôn nhanh 2 phút" (web tự chọn trò, hỏi từ đến hạn ôn trước)
 * thay cho danh sách 5 trò ngang nhau; ai muốn tự chọn trò vẫn có liên kết nhỏ bên dưới.
 */
export function ReviewPanel({ review, lockNote }: ReviewPanelProps) {
  const notEnough = review !== undefined && review.wordCount < PRACTICE_MIN_WORDS;
  const due = review?.dueCount ?? 0;

  return (
    <section aria-labelledby="review-heading">
      <h2 id="review-heading" className="text-[1.875rem] leading-tight">
        Ôn lại
      </h2>
      {!review ? (
        <Skeleton className="mt-3 h-5 w-full max-w-sm" />
      ) : (
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {notEnough
            ? `Học xong bài đầu tiên để mở phần ôn lại (cần ít nhất ${PRACTICE_MIN_WORDS} từ).`
            : due > 0
              ? "Ôn đúng lúc sắp quên giúp nhớ lâu hơn. Mỗi lượt vài phút, không thay cho bài mới."
              : "Hôm nay chưa có từ nào đến hạn ôn. Ôn thêm vài phút vẫn giúp nhớ lâu hơn."}
        </p>
      )}

      <div className="mt-5 rounded-lg border border-line bg-card p-6">
        <p className="text-[13px] font-medium text-muted-foreground">Ôn nhanh 2 phút</p>
        {review ? (
          <p className="mt-2 flex items-baseline gap-2.5">
            <span className="font-serif text-[2.75rem] leading-none tabular-nums">{due > 0 ? due : review.wordCount}</span>
            <span className="text-[15px] text-muted-foreground">{due > 0 ? "từ cần ôn hôm nay" : "từ bạn đã học"}</span>
          </p>
        ) : (
          <Skeleton className="mt-2 h-11 w-40" />
        )}
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          Web tự chọn một trò chơi và hỏi lại từ bạn hay quên trước.
        </p>
        {notEnough || !review ? (
          <Button size="lg" className="mt-5" disabled>
            Bắt đầu ôn
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button asChild size="lg" className="mt-5">
            <Link href={`/practice/${QUICK_REVIEW_SLUG}`}>
              Bắt đầu ôn
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>

      {!notEnough && (
        <p className="mt-4 text-[14px] leading-loose text-muted-foreground">
          Hoặc tự chọn trò:{" "}
          {PRACTICE_MODES.map((meta, i) => (
            <span key={meta.mode}>
              {i > 0 && <span aria-hidden> · </span>}
              <Link
                href={`/practice/${meta.slug}`}
                prefetch={false}
                className="font-medium whitespace-nowrap text-foreground underline decoration-line-strong underline-offset-4 hover:decoration-moss"
              >
                {meta.title}
              </Link>
            </span>
          ))}
        </p>
      )}

      {lockNote && (
        <p className="mt-4 flex items-start gap-2.5 text-[14px] leading-relaxed text-muted-foreground">
          <LockKeyhole aria-hidden className="mt-1 size-4 shrink-0" />
          <span>
            <b className="font-semibold text-foreground">{lockNote.title}</b> {lockNote.text}
          </span>
        </p>
      )}
    </section>
  );
}
