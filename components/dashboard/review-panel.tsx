import { LockKeyhole } from "lucide-react";

import { PracticeModeRow } from "@/components/practice/practice-mode-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PRACTICE_MIN_WORDS, PRACTICE_MODES } from "@/lib/practice";
import type { PracticeDataResponse } from "@/types/api";

interface ReviewPanelProps {
  data: PracticeDataResponse | undefined;
  isLoading: boolean;
  /** Ghi chú về bài ôn tập cuối chương còn khóa, vd "Ôn tập: Làm quen là bài cuối chương 1…" */
  lockNote?: { title: string; text: string } | null;
}

/** Khối "Ôn lại" ở trang chủ: các trò chơi dùng từ của những bài đã mở, không thay cho bài mới */
export function ReviewPanel({ data, isLoading, lockNote }: ReviewPanelProps) {
  const wordCount = data?.words.length ?? 0;
  const weakCount = data?.words.filter((w) => w.rating === 1 || w.rating === 2).length ?? 0;
  const notEnough = !isLoading && wordCount < PRACTICE_MIN_WORDS;

  return (
    <section aria-labelledby="review-heading">
      <h2 id="review-heading" className="text-[1.875rem] leading-tight">
        Ôn lại
      </h2>
      {isLoading ? (
        <Skeleton className="mt-3 h-5 w-full max-w-sm" />
      ) : (
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {notEnough
            ? `Học xong bài đầu tiên để mở phần ôn lại (cần ít nhất ${PRACTICE_MIN_WORDS} từ).`
            : `Dùng ${wordCount} từ trong các bài đã mở${weakCount > 0 ? `, ưu tiên ${weakCount} từ bạn chưa nhớ` : ""}. Mỗi lượt vài phút, không thay cho bài mới.`}
        </p>
      )}

      <ul className="mt-5 border-t border-line">
        {PRACTICE_MODES.map((meta) => (
          <li key={meta.mode} className="border-b border-line">
            <PracticeModeRow meta={meta} bestScore={data?.stats.bestScores[meta.mode]} disabled={isLoading || notEnough} />
          </li>
        ))}
      </ul>

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
