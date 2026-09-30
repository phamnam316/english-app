"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Flame, Trophy } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { ErrorState } from "@/components/error-state";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/types/api";

const PERIODS: Array<{ value: LeaderboardPeriod; label: string }> = [
  { value: "week", label: "Tuần này" },
  { value: "all", label: "Tất cả" },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const { data, error, isLoading, refetch } = useApiQuery((signal) => api.getLeaderboard(period, signal), [period]);

  const entries = data?.entries ?? [];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <>
      <AppHeader title="Bảng xếp hạng" subtitle="Thi đua XP cùng bạn bè" />

      <main className="mx-auto w-full max-w-2xl px-5 pt-6 pb-28 sm:px-6 md:pb-16">
        <div role="tablist" aria-label="Khoảng thời gian" className="grid grid-cols-2 gap-1 rounded-full bg-surface-soft p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="tab"
              aria-selected={period === p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "h-10 rounded-full text-sm font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                period === p.value ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {period === "week"
            ? "XP nhận được từ thứ Hai tuần này: học xong bài mới và luyện tập."
            : "Tổng XP từ trước tới nay."}
        </p>

        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Đang tải bảng xếp hạng">
              <Skeleton className="h-52 w-full rounded-3xl" />
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <ErrorState title="Không tải được bảng xếp hạng" error={error} onRetry={refetch} />
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface-soft px-6 py-12 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-tile-yellow text-tile-foreground">
                <Trophy className="size-7" />
              </span>
              <p className="font-semibold">{period === "week" ? "Tuần này chưa ai có XP" : "Chưa ai có XP"}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Học xong 1 bài hoặc chơi 1 lượt luyện tập để mở màn bảng xếp hạng!
              </p>
              <Button asChild className="mt-2">
                <Link href="/practice">Luyện tập ngay</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Podium entries={podium} />
              {rest.length > 0 && (
                <ol className="space-y-2">
                  {rest.map((entry) => (
                    <li key={entry.rank}>
                      <EntryRow entry={entry} />
                    </li>
                  ))}
                </ol>
              )}
              {data?.me && (
                <div className="space-y-2">
                  <p className="text-center text-xs text-muted-foreground">Hạng của bạn</p>
                  <EntryRow entry={data.me} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

const PODIUM_STYLE: Record<number, { block: string; height: string; ring: string }> = {
  1: { block: "bg-tile-yellow", height: "h-28", ring: "ring-tile-yellow" },
  2: { block: "bg-tile-lavender", height: "h-20", ring: "ring-tile-lavender" },
  3: { block: "bg-tile-peach", height: "h-16", ring: "ring-tile-peach" },
};

/** Bục trao giải cho top 3: hạng 2 bên trái, hạng 1 ở giữa (cao nhất), hạng 3 bên phải */
function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const order = [entries[1], entries[0], entries[2]];

  return (
    <section aria-label="Top 3" className="grid grid-cols-3 items-end gap-2 rounded-3xl bg-surface-soft px-3 pt-6 sm:gap-4 sm:px-6">
      {order.map((entry, i) => {
        if (!entry) return <div key={i} />;
        const style = PODIUM_STYLE[entry.rank] ?? PODIUM_STYLE[3];
        return (
          <div key={entry.rank} className="flex min-w-0 flex-col items-center gap-2 text-center">
            <div className="relative">
              {entry.rank === 1 && (
                <Crown aria-hidden className="absolute -top-6 left-1/2 size-6 -translate-x-1/2 fill-xp text-xp" />
              )}
              <UserAvatar
                user={entry}
                className={cn("ring-4", style.ring, entry.rank === 1 ? "size-16 text-xl" : "size-12 text-base")}
              />
            </div>
            <div className="w-full min-w-0">
              <p className={cn("truncate text-sm font-semibold", entry.isMe && "text-primary")}>
                {entry.isMe ? "Bạn" : entry.name}
              </p>
              <p className="text-xs font-medium text-muted-foreground tabular-nums">{entry.xp} XP</p>
            </div>
            <div
              className={cn(
                "grid w-full place-items-center rounded-t-2xl font-heading text-2xl font-bold text-tile-foreground",
                style.block,
                style.height,
              )}
            >
              {entry.rank}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function EntryRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-soft",
        entry.isMe && "border-primary/40 bg-secondary",
      )}
    >
      <span className="w-7 text-center font-heading text-base font-semibold text-muted-foreground tabular-nums">
        {entry.rank}
      </span>
      <UserAvatar user={entry} className="size-10" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {entry.name}
          {entry.isMe && <span className="ml-1.5 text-sm font-semibold text-primary">(Bạn)</span>}
        </span>
        {entry.streak > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Flame aria-hidden className="size-3.5 fill-streak text-streak" />
            {entry.streak} ngày liên tiếp
          </span>
        )}
      </span>
      <span className="shrink-0 font-semibold tabular-nums">{entry.xp} XP</span>
    </div>
  );
}
