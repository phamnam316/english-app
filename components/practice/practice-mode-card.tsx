import Link from "next/link";
import { ChevronRight, Crown, ListOrdered, Mic, PenLine, Shuffle, Timer, type LucideIcon } from "lucide-react";
import type { PracticeMode } from "@prisma/client";

import type { PracticeModeMeta } from "@/lib/practice";
import { cn } from "@/lib/utils";

export const PRACTICE_MODE_ICON: Record<PracticeMode, LucideIcon> = {
  MATCH: Shuffle,
  SPEED: Timer,
  DICTATION: PenLine,
  SENTENCE: ListOrdered,
  PRONUNCIATION: Mic,
};

/** Ô biểu tượng của trò chơi (màn giới thiệu luật chơi) */
export function PracticeModeTile({
  meta,
  className,
  iconClassName,
}: {
  meta: PracticeModeMeta;
  className?: string;
  iconClassName?: string;
}) {
  const Icon = PRACTICE_MODE_ICON[meta.mode];
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-16 shrink-0 place-items-center rounded-full border border-line-strong bg-card text-moss",
        className,
      )}
    >
      <Icon className={cn("size-7", iconClassName)} strokeWidth={1.6} />
    </span>
  );
}

interface PracticeModeRowProps {
  meta: PracticeModeMeta;
  /** Kỷ lục (trò tính giờ) */
  bestScore?: number;
  /** Ghi chú thêm, vd trình duyệt không hỗ trợ micro */
  note?: string;
  /** Chưa đủ từ để chơi: hiện dạng mờ, không bấm được */
  disabled?: boolean;
}

/** 1 hàng trong danh sách trò ôn tập: biểu tượng, tên + mô tả 1 dòng, độ dài lượt chơi */
export function PracticeModeRow({ meta, bestScore, note, disabled = false }: PracticeModeRowProps) {
  const Icon = PRACTICE_MODE_ICON[meta.mode];
  const content = (
    <>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" strokeWidth={1.7} />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{meta.title}</span>
        <span className="mt-0.5 block text-[14px] leading-snug text-muted-foreground">{meta.summary}</span>
        {(note || (meta.timed && bestScore !== undefined && bestScore > 0)) && (
          <span className="mt-1 flex flex-wrap gap-x-3 text-[13px] font-medium">
            {meta.timed && bestScore !== undefined && bestScore > 0 && (
              <span className="inline-flex items-center gap-1 text-clay-strong">
                <Crown aria-hidden className="size-3.5" />
                Kỷ lục {bestScore}
              </span>
            )}
            {note && <span className="text-destructive">{note}</span>}
          </span>
        )}
      </span>
      <span className="shrink-0 pt-0.5 text-[14px] whitespace-nowrap text-muted-foreground tabular-nums">{meta.length}</span>
      <ChevronRight aria-hidden className="mt-0.5 size-4 shrink-0 text-line-strong transition-transform group-hover:translate-x-0.5" />
    </>
  );

  const className = "group flex items-start gap-4 px-1 py-4 outline-none";

  if (disabled) {
    return (
      <div aria-disabled="true" className={cn(className, "opacity-50")}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/practice/${meta.slug}`}
      className={cn(className, "-mx-2 rounded-md px-3 transition-colors hover:bg-card focus-visible:bg-card focus-visible:outline-2 focus-visible:outline-ring")}
    >
      {content}
    </Link>
  );
}
