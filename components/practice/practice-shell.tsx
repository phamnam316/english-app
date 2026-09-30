"use client";

import Link from "next/link";
import { Check, Crown, X } from "lucide-react";

import { LessonFooter } from "@/components/lesson/lesson-footer";
import { PracticeModeTile } from "@/components/practice/practice-mode-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

/** Khung màn chơi: nút thoát + thanh tiến độ/thời gian, toàn màn hình như màn học bài */
export function PracticeShell({ title, progress, progressLabel, urgent = false, children }: PracticeShellProps) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-background">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <Button asChild variant="ghost" size="icon" className="size-10 text-muted-foreground">
            <Link href="/practice" aria-label="Thoát, về trang Luyện tập">
              <X className="size-6" />
            </Link>
          </Button>
          <Progress
            value={progress}
            aria-label={title}
            className={cn("h-2.5 flex-1", urgent && "[&>*]:bg-destructive")}
          />
          <span
            className={cn(
              "min-w-12 text-right text-sm font-semibold whitespace-nowrap tabular-nums",
              urgent ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {progressLabel}
          </span>
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
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 pt-4 pb-32 text-center">
        <PracticeModeTile meta={meta} className="size-24 rounded-[1.75rem]" iconClassName="size-11" />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">{meta.title}</h1>
          <p className="leading-relaxed text-muted-foreground">{meta.description}</p>
        </div>
        <ul className="w-full space-y-2.5 rounded-3xl bg-surface-soft p-5 text-left text-sm leading-relaxed">
          {meta.rules.map((rule) => (
            <li key={rule} className="flex gap-2.5">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={3} />
              {rule}
            </li>
          ))}
        </ul>
        {meta.timed && bestScore !== null && (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium">
            <Crown aria-hidden className="size-4 text-xp" />
            Kỷ lục của bạn: <span className="font-semibold tabular-nums">{bestScore}</span>
          </p>
        )}
        {blockedReason && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-destructive">
            {blockedReason}
          </p>
        )}
      </div>
      <LessonFooter className="justify-end">
        <Button size="lg" autoFocus className="w-full sm:w-auto sm:min-w-56" disabled={Boolean(blockedReason)} onClick={onStart}>
          Bắt đầu
        </Button>
      </LessonFooter>
    </>
  );
}
