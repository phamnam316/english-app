"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Languages, Pause, Play, Volume2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Kbd, LessonFooter } from "@/components/lesson/lesson-footer";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";
import { isTypingTarget } from "@/lib/dom";
import { cn } from "@/lib/utils";
import { useLessonStore } from "@/store/useLessonStore";

/** Màu ảnh đại diện của các nhân vật phụ (nhân vật chính luôn màu đất nung) */
const SIDE_COLORS = ["bg-moss-soft text-moss-strong", "bg-panel text-foreground", "bg-line text-foreground"];

/**
 * Mở đầu bài: 1 đoạn hội thoại ngắn đặt các từ sắp học vào tình huống đời thường.
 * Chạm vào câu để nghe và xem nghĩa; "Nghe cả đoạn" đọc lần lượt từng câu, câu đang đọc được làm nổi.
 */
export function StoryView() {
  const { story, vocabCount, hasGrammar, exerciseCount, finishStory } = useLessonStore(
    useShallow((s) => ({
      story: s.lesson?.story ?? null,
      vocabCount: s.vocabularies.length,
      hasGrammar: Boolean(s.lesson?.grammarNote),
      exerciseCount: s.exercises.length,
      finishStory: s.finishStory,
    })),
  );
  const { speakAll, stop } = useSpeech();
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [playing, setPlaying] = useState(-1);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTypingTarget(event.target)) return;
      if (event.key === "ArrowRight") finishStory();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finishStory]);

  if (!story) return null;

  // Nhân vật phụ: gán màu theo thứ tự xuất hiện
  const sideSpeakers = [...new Set(story.lines.map((l) => l.speaker).filter((name) => name !== story.main))];
  const colorOf = (speaker: string) =>
    speaker === story.main ? "bg-clay text-white" : SIDE_COLORS[sideSpeakers.indexOf(speaker) % SIDE_COLORS.length];

  const playLine = (index: number) => {
    setRevealed((current) => new Set(current).add(index));
    // Đọc 1 câu như 1 chuỗi 1 phần tử: câu được làm nổi đúng trong lúc đọc
    void speakAll([story.lines[index].en], { onLine: (i) => setPlaying(i === 0 ? index : -1) });
  };

  const togglePlayAll = () => {
    if (playing !== -1) {
      stop();
      setPlaying(-1);
      return;
    }
    void speakAll(
      story.lines.map((l) => l.en),
      { onLine: (index) => setPlaying(index) },
    );
  };

  const nextLabel =
    vocabCount > 0
      ? `Học ${vocabCount} từ mới trong đoạn này`
      : hasGrammar
        ? "Xem mẹo ghép câu"
        : exerciseCount > 0
          ? `Làm bài tập (${exerciseCount} câu)`
          : "Hoàn thành";

  return (
    <>
      <article className="w-full max-w-[720px] pt-6 pb-36 animate-in fade-in duration-300 sm:pt-10 lg:pt-12 motion-reduce:animate-none">
        <p className="text-[14px] text-muted-foreground">Tình huống</p>
        <h1 className="mt-2 text-[2.5rem] leading-[1.08] tracking-[-0.015em] text-balance sm:text-[3.25rem]">
          {story.title}
        </h1>
        {story.intro && <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">{story.intro}</p>}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={togglePlayAll}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-moss px-4 text-[15px] font-semibold text-white outline-none hover:bg-moss-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss dark:text-primary-foreground"
          >
            {playing !== -1 ? <Pause className="size-[18px]" /> : <Play className="size-[18px]" />}
            {playing !== -1 ? "Dừng" : "Nghe cả đoạn"}
          </button>
          <button
            type="button"
            aria-pressed={showAll}
            onClick={() => setShowAll((v) => !v)}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-medium outline-none focus-visible:outline-2 focus-visible:outline-ring",
              showAll ? "border-moss bg-moss-soft text-moss-strong" : "border-line-strong hover:bg-card",
            )}
          >
            <Languages className="size-[18px]" />
            {showAll ? "Ẩn bản dịch" : "Hiện bản dịch"}
          </button>
        </div>

        <ol className="mt-8 space-y-4" aria-label="Đoạn hội thoại">
          {story.lines.map((line, index) => {
            const isMain = line.speaker === story.main;
            const isPlaying = playing === index;
            const showVi = showAll || revealed.has(index);
            return (
              <li key={index} className={cn("flex items-end gap-3", isMain && "flex-row-reverse")}>
                <span
                  aria-hidden
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold",
                    colorOf(line.speaker),
                  )}
                >
                  {line.speaker.slice(0, 2)}
                </span>
                <button
                  type="button"
                  onClick={() => playLine(index)}
                  aria-label={`${line.speaker}: ${line.en}. Chạm để nghe và xem nghĩa`}
                  className={cn(
                    "max-w-[85%] rounded-lg border px-4 py-3 text-left outline-none transition-colors focus-visible:outline-2 focus-visible:outline-ring sm:max-w-[75%]",
                    isMain ? "rounded-br-sm border-clay/30 bg-clay-soft" : "rounded-bl-sm border-line bg-card",
                    isPlaying && "ring-2 ring-moss",
                  )}
                >
                  <span className="flex items-center justify-between gap-3 text-[12px] font-medium text-muted-foreground">
                    {line.speaker}
                    <Volume2 aria-hidden className={cn("size-3.5", isPlaying && "text-moss")} />
                  </span>
                  <span className="mt-0.5 block font-serif text-[1.25rem] leading-snug">{line.en}</span>
                  {showVi && <span className="mt-1 block text-[14px] text-muted-foreground">{line.vi}</span>}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 text-[14px] text-muted-foreground">Chạm vào một câu để nghe lại và xem nghĩa.</p>
      </article>

      <LessonFooter className="justify-end">
        <p className="mr-auto hidden text-[13px] text-muted-foreground md:block">
          <Kbd>→</Kbd> để sang phần tiếp theo
        </p>
        <Button
          size="lg"
          className="min-w-0 flex-1 sm:max-w-96 sm:flex-none sm:min-w-56"
          onClick={() => {
            stop();
            finishStory();
          }}
        >
          <span className="truncate">{nextLabel}</span>
          <ChevronRight className="size-4" />
        </Button>
      </LessonFooter>
    </>
  );
}
