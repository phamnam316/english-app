"use client";

import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { ErrorState } from "@/components/error-state";
import { PracticeModeCard } from "@/components/practice/practice-mode-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { api } from "@/lib/api-client";
import { PRACTICE_MIN_WORDS, PRACTICE_MODES } from "@/lib/practice";

export default function PracticePage() {
  const { data, error, isLoading, refetch } = useApiQuery((signal) => api.getPractice(signal), []);
  const { isSupported: canRecognizeSpeech } = useSpeechRecognition();

  return (
    <>
      <AppHeader title="Luyện tập" subtitle="Mỗi lượt 1–2 phút, ôn lại từ bạn đã học" />

      <main className="mx-auto w-full max-w-5xl px-5 pt-6 pb-28 sm:px-6 md:pb-16">
        {isLoading ? (
          <div className="space-y-6" aria-busy="true" aria-label="Đang tải">
            <Skeleton className="h-36 w-full rounded-3xl" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-28 rounded-3xl" />
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState title="Không tải được trang luyện tập" error={error} onRetry={refetch} backHref="/dashboard" />
        ) : (
          data && (
            <div className="space-y-8">
              <section
                aria-label="XP luyện tập hôm nay"
                className="relative overflow-hidden rounded-3xl bg-hero-navy p-5 text-navy-foreground sm:p-6"
              >
                <div aria-hidden className="absolute -top-16 -right-10 size-48 rounded-full bg-[#6e58fc]/40 blur-2xl" />
                <div className="relative flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15">
                    <Sparkles className="size-6 text-xp" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="text-sm text-white/75">XP luyện tập hôm nay</p>
                      <p className="font-heading text-2xl font-semibold tabular-nums">
                        {data.stats.todayXp}
                        <span className="text-base font-medium text-white/70"> / {data.stats.dailyXpCap} XP</span>
                      </p>
                    </div>
                    <Progress
                      value={(data.stats.todayXp / data.stats.dailyXpCap) * 100}
                      aria-hidden
                      className="h-2 bg-white/15 [&>*]:bg-xp"
                    />
                    <p className="text-sm text-white/75">
                      Mỗi câu đúng +1 XP, tối đa 10 XP một lượt. Có {data.words.length} từ để luyện, lấy từ các bài bạn đã mở.
                    </p>
                  </div>
                </div>
              </section>

              {data.words.length < PRACTICE_MIN_WORDS ? (
                <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface-soft px-6 py-12 text-center">
                  <span className="grid size-14 place-items-center rounded-2xl bg-tile-lavender text-tile-foreground">
                    <BookOpen className="size-7" />
                  </span>
                  <p className="font-semibold">Chưa đủ từ để luyện tập</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Cần ít nhất {PRACTICE_MIN_WORDS} từ. Học bài đầu tiên của một khóa học để mở khóa các trò chơi.
                  </p>
                  <Button asChild className="mt-2">
                    <Link href="/dashboard">Về trang chủ</Link>
                  </Button>
                </div>
              ) : (
                <section aria-labelledby="modes-heading" className="space-y-4">
                  <h2 id="modes-heading" className="text-lg font-semibold">
                    Chọn trò chơi
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PRACTICE_MODES.map((meta) => (
                      <PracticeModeCard
                        key={meta.mode}
                        meta={meta}
                        bestScore={data.stats.bestScores[meta.mode]}
                        note={meta.mode === "PRONUNCIATION" && !canRecognizeSpeech ? "Cần Chrome hoặc Edge" : undefined}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )
        )}
      </main>
    </>
  );
}
