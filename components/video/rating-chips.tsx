import { Check } from "lucide-react";

import { WORD_RATINGS } from "@/lib/word-rating";
import { cn } from "@/lib/utils";
import type { WordRating } from "@/types/api";

interface RatingChipsProps {
  word: string;
  rating: WordRating | null;
  /** Bấm lại mức đang chọn = bỏ đánh giá (null) */
  onRate: (rating: WordRating | null) => void;
  className?: string;
}

/**
 * Chọn mức nhớ 1 từ (Chưa nhớ / Hơi nhớ / Đã nhớ), cùng màu với màn học từ trong bài.
 * Chọn mức nào cũng là lưu từ vào lịch ôn: từ sẽ xuất hiện trong trang Luyện tập khi đến hạn.
 */
export function RatingChips({ word, rating, onRate, className }: RatingChipsProps) {
  return (
    <div role="group" aria-label={`Mức nhớ từ ${word}`} className={cn("flex flex-wrap gap-1.5", className)}>
      {WORD_RATINGS.map(({ value, label }) => {
        const active = rating === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onRate(active ? null : value)}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] font-medium outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              !active && "border-line-strong text-muted-foreground",
              !active && value === 1 && "hover:border-destructive hover:text-destructive",
              !active && value === 2 && "hover:border-clay hover:text-clay-strong",
              !active && value === 3 && "hover:border-moss hover:text-moss-strong",
              active && value === 1 && "border-destructive bg-danger-soft font-semibold text-destructive",
              active && value === 2 && "border-clay bg-clay-soft font-semibold text-clay-strong",
              active && value === 3 && "border-moss bg-moss-soft font-semibold text-moss-strong",
            )}
          >
            {active && <Check aria-hidden className="size-3.5" strokeWidth={2.5} />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
