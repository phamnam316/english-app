"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle, Volume2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { RichText } from "@/components/rich-text";
import { Kbd, LessonFooter } from "@/components/lesson/lesson-footer";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";
import { isTypingTarget } from "@/lib/dom";
import { useLessonStore } from "@/store/useLessonStore";

/** Giữa phần học từ và phần làm bài: 1 điểm ngữ pháp ngắn gọn với mẫu câu, ví dụ có phát âm và lỗi hay gặp */
export function GrammarView() {
  const { note, vocabCount, exerciseCount, goToVocab, startQuiz } = useLessonStore(
    useShallow((s) => ({
      note: s.lesson?.grammarNote ?? null,
      vocabCount: s.vocabularies.length,
      exerciseCount: s.exercises.length,
      goToVocab: s.goToVocab,
      startQuiz: s.startQuiz,
    })),
  );
  const { speak, isLoading } = useSpeech();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTypingTarget(event.target)) return;
      if (event.key === "ArrowRight") startQuiz();
      if (event.key === "ArrowLeft" && vocabCount > 0) goToVocab(vocabCount - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToVocab, startQuiz, vocabCount]);

  if (!note) return null;

  return (
    <>
      <article className="w-full max-w-[720px] pt-6 pb-36 animate-in fade-in duration-300 sm:pt-10 lg:pt-12 motion-reduce:animate-none">
        <p className="text-[14px] text-muted-foreground">Mẹo ghép câu</p>
        <h1 className="mt-2 text-[2.5rem] leading-[1.08] tracking-[-0.015em] text-balance sm:text-[3.25rem]">{note.title}</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed">
          <RichText text={note.intro} />
        </p>

        {note.patterns.length > 0 && (
          <div className="mt-8 space-y-2.5 rounded-lg border border-line bg-card px-6 py-5">
            <p className="text-[13px] font-medium text-muted-foreground">Mẫu câu</p>
            {note.patterns.map((pattern) => (
              <p key={pattern} className="font-serif text-[1.25rem] leading-snug">
                <RichText text={pattern} />
              </p>
            ))}
          </div>
        )}

        {note.examples.length > 0 && (
          <ul className="mt-8 border-t-2 border-foreground">
            {note.examples.map((example) => (
              <li key={example.en} className="flex items-start gap-4 border-b border-line py-5">
                <button
                  type="button"
                  aria-label={`Nghe câu: ${example.en}`}
                  onClick={() => void speak(example.en)}
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong text-moss outline-none hover:border-moss hover:bg-card focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {isLoading(example.en) ? <LoaderCircle className="size-4 animate-spin" /> : <Volume2 className="size-4" />}
                </button>
                <div className="min-w-0">
                  <p className="font-serif text-[1.375rem] leading-snug">{example.en}</p>
                  <p className="mt-1 text-[15px] text-muted-foreground">{example.vi}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {note.avoid && (
          <p className="mt-6 border-t border-dashed border-line-strong pt-5 text-[15px] leading-relaxed">
            <b className="font-semibold text-destructive">Tránh: </b>
            <span className="text-muted-foreground line-through decoration-destructive/60">{note.avoid.wrong}</span>{" "}
            <RichText text={note.avoid.fix} />
          </p>
        )}
      </article>

      <LessonFooter className="justify-end">
        <p className="mr-auto hidden text-[13px] text-muted-foreground md:block">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd> để chuyển phần
        </p>
        {vocabCount > 0 && (
          <Button variant="outline" size="lg" className="px-4 sm:px-5" onClick={() => goToVocab(vocabCount - 1)}>
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Xem lại từ</span>
          </Button>
        )}
        <Button size="lg" className="flex-1 sm:max-w-80 sm:flex-none sm:min-w-56" onClick={startQuiz}>
          {exerciseCount > 0 ? `Làm bài tập (${exerciseCount} câu)` : "Hoàn thành"}
          <ChevronRight className="size-4" />
        </Button>
      </LessonFooter>
    </>
  );
}
