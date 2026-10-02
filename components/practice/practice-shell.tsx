"use client";

import Link from "next/link";
import { Check, Crown, X } from "lucide-react";

import { LessonFooter } from "@/components/lesson/lesson-footer";
import { PracticeModeTile } from "@/components/practice/practice-mode-card";
import { Button } from "@/components/ui/button";
import type { PracticeModeMeta } from "@/lib/practice";
import { cn } from "@/lib/utils";

interface PracticeShellProps {
  title: string;
  /** 0-100: số câu đã làm, hoặc thời gian còn lại với trò tính giờ */
  progress: number;
  /** Chữ bên phải thanh tiến độ: "3/8", "45s" */
  progressLabel: string;
  /** Sắp hết giờ: thanh chuyển đỏ */
  urgent?: boolean;
  children: React.ReactNode;
}

/** Khung màn chơi: nút thoát, tên trò, thanh tiến độ/thời gian; toàn màn hình như màn học bài */
export function PracticeShell({ title, progress, progressLabel, urgent = false, children }: PracticeShellProps) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-background">
      <header className="sticky top-0 z-20 border-b border-line bg-background">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-3 px-2 sm:gap-5 sm:px-8">
          <Link
            href="/practice"
            aria-label="Thoát, về trang Luyện tập"
            className="grid size-10 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-line/60 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-5" />
          </Link>
          <p className="min-w-0 flex-1 truncate text-[15px]">
            <span className="hidden text-muted-foreground sm:inline">Luyện tập — </span>
            <b className="font-semibold">{title}</b>
          </p>
          <div className="ml-auto flex w-32 shrink-0 items-center gap-3 sm:w-64">
            <div
              role="progressbar"
              aria-label={title}
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-[5px] flex-1 overflow-hidden rounded-full bg-line"
            >
              <div
                className={cn("h-full rounded-full transition-[width] duration-300", urgent ? "bg-destructive" : "bg-moss")}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span
              className={cn(
                "min-w-10 text-right text-sm font-semibold whitespace-nowrap tabular-nums",
                urgent ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {progressLabel}
            </span>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}

interface PracticeIntroProps {
  meta: PracticeModeMeta;
  bestScore: number | null;
  onStart: () => void;
  /** Có lý do không chơi được (vd trình duyệt không hỗ trợ micro) -> khóa nút Bắt đầu */
  blockedReason?: string | null;
}

/** Màn giới thiệu luật chơi trước lượt đầu tiên (cú bấm "Bắt đầu" cũng cho phép trình duyệt phát âm thanh) */
export function PracticeIntro({ meta, bestScore, onStart, blockedReason }: PracticeIntroProps) {
  return (
    <>
      <div className="mx-auto w-full max-w-[560px] px-4 pt-10 pb-36 sm:pt-14">
        <section className="rounded-lg border border-line bg-card p-6 sm:p-9">
          <PracticeModeTile meta={meta} />
          <h1 className="mt-5 text-[2.5rem] leading-[1.05] tracking-[-0.015em]">{meta.title}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{meta.description}</p>
          <ul className="mt-6 space-y-2.5 border-t border-line pt-5 text-[15px] leading-relaxed">
            {meta.rules.map((rule) => (
              <li key={rule} className="flex gap-2.5">
                <Check aria-hidden className="mt-1 size-4 shrink-0 text-moss" strokeWidth={2.5} />
                {rule}
              </li>
            ))}
          </ul>
          {meta.timed && bestScore !== null && bestScore > 0 && (
            <p className="mt-5 inline-flex items-center gap-1.5 text-[15px]">
              <Crown aria-hidden className="size-4 text-clay" />
              Kỷ lục của bạn: <b className="font-semibold tabular-nums">{bestScore}</b>
            </p>
          )}
          {blockedReason && (
            <p role="alert" className="mt-5 rounded-md bg-danger-soft px-4 py-3 text-[14px] font-medium text-destructive">
              {blockedReason}
            </p>
          )}
        </section>
      </div>
      <LessonFooter className="justify-end">
        <Button size="lg" autoFocus className="w-full sm:w-auto sm:min-w-56" disabled={Boolean(blockedReason)} onClick={onStart}>
          Bắt đầu · {meta.length}
        </Button>
      </LessonFooter>
    </>
  );
}
