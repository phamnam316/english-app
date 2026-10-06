import { Check, Flame } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { HomeResponse } from "@/types/api";

interface TodayGoalProps {
  streak: number;
  today: HomeResponse["today"] | undefined;
}

/** Thanh đầu trang chủ: chuỗi ngày học + mục tiêu nhỏ mỗi ngày (học 1 bài, ôn 1 lượt) */
export function TodayGoal({ streak, today }: TodayGoalProps) {
  const goals = [
    { label: "Học 1 bài", done: (today?.lessonsCompleted ?? 0) > 0 },
    { label: "Ôn 1 lượt", done: (today?.practiceRounds ?? 0) > 0 },
  ];
  const doneCount = goals.filter((g) => g.done).length;
  const allDone = doneCount === goals.length;

  return (
    <section
      aria-label="Mục tiêu hôm nay"
      className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-line bg-card px-5 py-3.5 sm:px-6"
    >
      <p className="inline-flex items-center gap-2 text-[15px]">
        <Flame aria-hidden className={cn("size-[18px]", streak > 0 ? "text-clay" : "text-muted-foreground")} />
        <b className="font-semibold tabular-nums">{streak}</b> ngày liên tiếp
      </p>
      <span aria-hidden className="hidden h-5 w-px bg-line sm:block" />
      {today ? (
        <>
          <p className="text-[14px] font-medium text-muted-foreground">Mục tiêu hôm nay</p>
          <ul className="flex flex-wrap gap-2">
            {goals.map((goal) => (
              <li
                key={goal.label}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[14px]",
                  goal.done ? "border-moss bg-moss-soft font-semibold text-moss-strong" : "border-line-strong",
                )}
              >
                {goal.done ? (
                  <Check aria-hidden className="size-3.5" strokeWidth={3} />
                ) : (
                  <span aria-hidden className="size-2 rounded-full border border-line-strong" />
                )}
                {goal.label}
                <span className="sr-only">{goal.done ? ": đã xong" : ": chưa xong"}</span>
              </li>
            ))}
          </ul>
          <p className={cn("text-[14px] sm:ml-auto", allDone ? "font-semibold text-moss-strong" : "text-muted-foreground")}>
            {allDone ? "Xong mục tiêu hôm nay! Hẹn bạn ngày mai." : `${doneCount}/${goals.length} việc`}
          </p>
        </>
      ) : (
        <Skeleton className="h-8 w-64" />
      )}
    </section>
  );
}
