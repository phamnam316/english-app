import Link from "next/link";
import { ArrowRight, Blocks, Crown, Headphones, Mic, Puzzle, Timer, Zap, type LucideIcon } from "lucide-react";
import type { PracticeMode } from "@prisma/client";

import type { PracticeModeMeta } from "@/lib/practice";
import { cn } from "@/lib/utils";

export const PRACTICE_MODE_ICON: Record<PracticeMode, LucideIcon> = {
  MATCH: Puzzle,
  SPEED: Zap,
  DICTATION: Headphones,
  SENTENCE: Blocks,
  PRONUNCIATION: Mic,
};

/** Ô vuông màu pastel có icon của trò chơi (cùng kiểu thumbnail khóa học) */
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
        "relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl text-tile-foreground",
        meta.tileClass,
        className,
      )}
    >
      <span className="absolute -top-3 -right-3 size-10 rounded-full bg-white/35" />
      <span className="absolute -bottom-4 -left-3 size-9 rounded-full bg-white/25" />
      <Icon className={cn("relative size-7", iconClassName)} strokeWidth={1.75} />
    </span>
  );
}

/** Thẻ trò chơi dạng hàng ngang (trang Luyện tập) */
export function PracticeModeCard({
  meta,
  bestScore,
  note,
}: {
  meta: PracticeModeMeta;
  bestScore?: number;
  /** Ghi chú thêm, vd trình duyệt không hỗ trợ micro */
  note?: string;
}) {
  return (
    <Link
      href={`/practice/${meta.slug}`}
      className="group flex items-center gap-4 rounded-3xl border border-border/70 bg-card p-3 pr-4 shadow-soft outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
    >
      <PracticeModeTile meta={meta} className="size-20" iconClassName="size-8" />
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block font-heading text-base font-semibold">{meta.title}</span>
        <span className="line-clamp-2 block text-sm leading-snug text-muted-foreground">{meta.description}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Timer aria-hidden className="size-3.5" />
            {meta.length}
          </span>
          {meta.timed && bestScore !== undefined && (
            <span className="inline-flex items-center gap-1 text-xp-strong">
              <Crown aria-hidden className="size-3.5" />
              Kỷ lục {bestScore}
            </span>
          )}
          {note && <span className="text-destructive">{note}</span>}
        </span>
      </span>
      <ArrowRight
        aria-hidden
        className="size-5 shrink-0 text-navy transition-transform duration-200 group-hover:translate-x-0.5 dark:text-foreground"
      />
    </Link>
  );
}

/** Thẻ nhỏ màu pastel cho danh sách cuộn ngang ở trang chủ */
export function PracticeModeMiniCard({ meta }: { meta: PracticeModeMeta }) {
  const Icon = PRACTICE_MODE_ICON[meta.mode];
  return (
    <Link
      href={`/practice/${meta.slug}`}
      className={cn(
        "relative flex w-36 shrink-0 snap-start flex-col justify-between gap-8 overflow-hidden rounded-3xl p-4 text-tile-foreground outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring motion-reduce:transition-none sm:w-auto",
        meta.tileClass,
      )}
    >
      <span aria-hidden className="absolute -top-6 -right-6 size-20 rounded-full bg-white/30" />
      <span aria-hidden className="relative grid size-10 place-items-center rounded-2xl bg-white/60">
        <Icon className="size-5" />
      </span>
      <span className="relative">
        <span className="block font-heading leading-tight font-semibold">{meta.title}</span>
        <span className="text-xs opacity-75">{meta.length}</span>
      </span>
    </Link>
  );
}
