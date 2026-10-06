"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle, Volume2 } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PracticeModeRow } from "@/components/practice/practice-mode-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { useSpeech } from "@/hooks/use-speech";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { api } from "@/lib/api-client";
import { PRACTICE_MAX_XP_PER_ROUND, PRACTICE_MIN_WORDS, PRACTICE_MODES, QUICK_REVIEW_SLUG } from "@/lib/practice";
import { WORD_RATINGS } from "@/lib/word-rating";
import { cn } from "@/lib/utils";
import type { PracticeDataResponse, PracticeWord } from "@/types/api";

export default function PracticePage() {
  const { data, error, isLoading, refetch } = useApiQuery((signal) => api.getPractice(signal), [], {
    cacheKey: "practice",
  });
  const { isSupported: canRecognizeSpeech } = useSpeechRecognition();

  let content: React.ReactNode;
  if (isLoading) content = <PracticeSkeleton />;
  else if (error) {
    content = (
      <ErrorState title="Không tải được trang luyện tập" error={error} onRetry={refetch} backHref="/dashboard" />
    );
  } else if (data) {
    const notEnough = data.words.length < PRACTICE_MIN_WORDS;
    content = (
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
        <div className="min-w-0">
          <h1 className="text-[2.5rem] leading-[1.08] tracking-[-0.015em] sm:text-[3.25rem]">Ôn lại từ đã học</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {notEnough
              ? `Cần ít nhất ${PRACTICE_MIN_WORDS} từ để chơi. Học xong bài đầu tiên là chơi được ngay.`
              : "Trò chơi 2 phút để nhớ lại từ cũ. Từ nào bạn hay quên, trò chơi hỏi lại nhiều hơn."}
          </p>

          {!notEnough && (
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 rounded-lg border border-line bg-card px-5 py-4 sm:px-6">
              <p className="flex items-baseline gap-2.5">
                <span className="font-serif text-[2.25rem] leading-none tabular-nums">
                  {data.dueCount > 0 ? data.dueCount : data.words.length}
                </span>
                <span className="text-[15px] text-muted-foreground">
                  {data.dueCount > 0 ? "từ cần ôn hôm nay" : "từ bạn đã học, hôm nay chưa có từ đến hạn"}
                </span>
              </p>
              <Button asChild size="lg" className="sm:ml-auto">
                <Link href={`/practice/${QUICK_REVIEW_SLUG}`}>
                  Ôn nhanh 2 phút
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          )}

          {notEnough ? (
            <EmptyState
              className="mt-8"
              title="Chưa đủ từ để luyện tập"
              description="Mỗi bài học mở thêm từ mới cho phần ôn tập. Học xong bài đầu tiên là có thể chơi ngay."
              action={
                <Button asChild>
                  <Link href="/dashboard">Về trang chủ</Link>
                </Button>
              }
            />
          ) : (
            <>
              <h2 className="mt-10 font-sans text-[15px] font-semibold tracking-normal">Hoặc tự chọn trò</h2>
              <ul className="mt-3 border-t-2 border-foreground">
                {PRACTICE_MODES.map((meta) => (
                  <li key={meta.mode} className="border-b border-line">
                    <PracticeModeRow
                      meta={meta}
                      bestScore={data.stats.bestScores[meta.mode]}
                      note={meta.mode === "PRONUNCIATION" && !canRecognizeSpeech ? "Cần Chrome hoặc Edge" : undefined}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="space-y-10">
          <TodayXp stats={data.stats} />
          {!notEnough && <MemorySummary words={data.words} />}
        </aside>
      </div>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1180px] px-4 pt-8 pb-28 sm:px-8 sm:pt-12 md:pb-20">{content}</main>
    </>
  );
}

function TodayXp({ stats }: { stats: PracticeDataResponse["stats"] }) {
  const percent = Math.min(100, (stats.todayXp / stats.dailyXpCap) * 100);
  const isFull = stats.todayXp >= stats.dailyXpCap;

  return (
    <section aria-labelledby="xp-heading" className="rounded-lg border border-line bg-card p-6">
      <h2 id="xp-heading" className="font-sans text-[15px] font-semibold tracking-normal">
        XP luyện tập hôm nay
      </h2>
      <p className="mt-3 tabular-nums">
        <span className="font-serif text-[2.5rem] leading-none">{stats.todayXp}</span>
        <span className="text-[15px] text-muted-foreground"> / {stats.dailyXpCap} XP</span>
      </p>
      <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-clay" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
        {isFull
          ? "Bạn đã nhận đủ XP luyện tập hôm nay. Chơi tiếp vẫn giúp nhớ từ lâu hơn!"
          : `Mỗi câu đúng +1 XP, tối đa ${PRACTICE_MAX_XP_PER_ROUND} XP một lượt.`}
      </p>
    </section>
  );
}

/** Thống kê mức nhớ tự đánh giá và các từ nên ôn trước */
function MemorySummary({ words }: { words: PracticeWord[] }) {
  const { speak, isLoading } = useSpeech();
  const counts = WORD_RATINGS.map(({ value, label }) => ({
    value,
    label,
    count: words.filter((w) => w.rating === value).length,
  }));
  const unrated = words.filter((w) => w.rating === null).length;
  // Nên ôn trước: từ đến hạn ôn hôm nay, rồi đến từ tự đánh giá Chưa nhớ / Hơi nhớ
  const weak = [
    ...words.filter((w) => w.due),
    ...words.filter((w) => !w.due && w.rating === 1),
    ...words.filter((w) => !w.due && w.rating === 2),
  ].slice(0, 8);

  return (
    <section aria-labelledby="memory-heading">
      <h2 id="memory-heading" className="font-sans text-[15px] font-semibold tracking-normal">
        Mức nhớ của bạn
      </h2>
      <dl className="mt-3 border-t border-line">
        {counts.map(({ value, label, count }) => (
          <div key={value} className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-[15px]">
            <dt className="inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className={cn(
                  "size-2 rounded-full",
                  value === 1 && "bg-destructive",
                  value === 2 && "bg-clay",
                  value === 3 && "bg-moss",
                )}
              />
              {label}
            </dt>
            <dd className="font-semibold tabular-nums">{count}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-[15px] text-muted-foreground">
          <dt className="inline-flex items-center gap-2.5">
            <span aria-hidden className="size-2 rounded-full border border-line-strong" />
            Chưa đánh giá
          </dt>
          <dd className="tabular-nums">{unrated}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        Chọn mức nhớ cho từng từ ở phần học từ của mỗi bài.
      </p>

      {weak.length > 0 && (
        <>
          <h3 className="mt-8 text-[15px] font-semibold">Nên ôn trước</h3>
          <ul className="mt-2 border-t border-line">
            {weak.map((word) => (
              <li key={word.id} className="flex items-center gap-3 border-b border-line py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="font-serif text-[18px]">{word.word}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">{word.meaning}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Nghe từ ${word.word}`}
                  onClick={() => void speak(word.word, { audioUrl: word.audioUrl })}
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong text-moss outline-none hover:border-moss focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {isLoading(word.word) ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Volume2 className="size-4" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function PracticeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
      <div>
        <Skeleton className="h-12 w-80 max-w-full" />
        <Skeleton className="mt-4 h-4 w-96 max-w-full" />
        <div className="mt-8 border-t-2 border-line">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-line py-4">
              <Skeleton className="size-5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-44 w-full rounded-lg" />
    </div>
  );
}
