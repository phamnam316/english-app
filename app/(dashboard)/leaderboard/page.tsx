"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/types/api";

const PERIODS: Array<{ value: LeaderboardPeriod; label: string; note: string }> = [
  { value: "week", label: "Tuần này", note: "XP nhận được từ thứ Hai tuần này: học xong bài mới và luyện tập." },
  { value: "all", label: "Tất cả", note: "Tổng XP từ trước tới nay." },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const { data, error, isLoading, refetch } = useApiQuery((signal) => api.getLeaderboard(period, signal), [period]);

  const entries = data?.entries ?? [];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const current = PERIODS.find((p) => p.value === period)!;

  return (
    <>
      <AppHeader />

      <main className="mx-auto w-full max-w-[820px] px-4 pt-8 pb-28 sm:px-8 sm:pt-12 md:pb-20">
        <h1 className="text-[2.5rem] leading-[1.08] tracking-[-0.015em] sm:text-[3.25rem]">Bảng xếp hạng</h1>
        <p className="mt-3 text-[15px] text-muted-foreground">Thi đua XP cùng bạn bè. {current.note}</p>

        <div role="tablist" aria-label="Khoảng thời gian" className="mt-7 flex gap-7 border-b border-line">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="tab"
              aria-selected={period === p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "relative -mb-px pb-3 text-[15px] outline-none focus-visible:underline",
                period === p.value
                  ? "font-semibold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-clay"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Đang tải bảng xếp hạng">
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-40 rounded-lg" />
                ))}
              </div>
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : error ? (
            <ErrorState title="Không tải được bảng xếp hạng" error={error} onRetry={refetch} />
          ) : entries.length === 0 ? (
            <EmptyState
              title={period === "week" ? "Tuần này chưa ai có XP" : "Chưa ai có XP"}
              description="Học xong 1 bài hoặc chơi 1 lượt luyện tập để mở màn bảng xếp hạng!"
              action={
                <Button asChild>
                  <Link href="/practice">Luyện tập ngay</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-8">
              <Podium entries={podium} />
              {rest.length > 0 && (
                <ol className="border-t-2 border-foreground">
                  {rest.map((entry) => (
                    <li key={entry.rank} className="border-b border-line">
                      <EntryRow entry={entry} />
                    </li>
                  ))}
                </ol>
              )}
              {data?.me && (
                <div>
                  <p className="text-[13px] font-medium text-muted-foreground">Hạng của bạn</p>
                  <div className="mt-2 border-y border-line">
                    <EntryRow entry={data.me} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

/** Top 3: hạng 2 bên trái, hạng 1 ở giữa (có ruy băng), hạng 3 bên phải */
function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const order = [entries[1], entries[0], entries[2]];

  return (
    <section aria-label="Top 3" className="grid grid-cols-3 items-end gap-2.5 sm:gap-4">
      {order.map((entry, i) => {
        if (!entry) return <div key={i} />;
        const isFirst = entry.rank === 1;
        return (
          <div
            key={entry.rank}
            className={cn(
              "relative flex min-w-0 flex-col items-center rounded-lg border bg-card px-2 text-center",
              isFirst ? "border-line-strong pt-8 pb-6" : "border-line pt-6 pb-5",
              entry.isMe && "ring-2 ring-moss",
            )}
          >
            {isFirst && <span aria-hidden className="ribbon absolute top-0 right-4 h-9 w-4 bg-clay" />}
            <span className={cn("font-serif leading-none text-muted-foreground", isFirst ? "text-[2.75rem] text-clay-strong" : "text-[2rem]")}>
              {entry.rank}
            </span>
            <UserAvatar user={entry} className={cn("mt-3", isFirst ? "size-14 text-base" : "size-11")} />
            <p className="mt-2 w-full truncate text-[15px] font-semibold">{entry.isMe ? "Bạn" : entry.name}</p>
            <p className="text-[13px] text-muted-foreground tabular-nums">{entry.xp} XP</p>
          </div>
        );
      })}
    </section>
  );
}

function EntryRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className={cn("flex items-center gap-4 px-2 py-3", entry.isMe && "bg-moss-soft")}>
      <span className="w-8 text-center font-serif text-xl text-muted-foreground tabular-nums">{entry.rank}</span>
      <UserAvatar user={entry} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">
          {entry.name}
          {entry.isMe && <span className="ml-1.5 text-[13px] font-semibold text-moss-strong">(Bạn)</span>}
        </span>
        {entry.streak > 0 && (
          <span className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">
            <Flame aria-hidden className="size-3.5 text-clay" />
            {entry.streak} ngày liên tiếp
          </span>
        )}
      </span>
      <span className="shrink-0 text-[15px] tabular-nums">
        <b className="font-semibold">{entry.xp}</b> <span className="text-muted-foreground">XP</span>
      </span>
    </div>
  );
}
