"use client";

import { useRef, useState } from "react";
import { Check, Mic, Square, Volume2, X } from "lucide-react";

import { LessonFooter } from "@/components/lesson/lesson-footer";
import { PracticeIntro, PracticeShell } from "@/components/practice/practice-shell";
import { PracticeResult } from "@/components/practice/practice-result";
import type { GamePhase, PracticeGameProps } from "@/components/practice/types";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";
import {
  RECOGNITION_ERROR_MESSAGES,
  SpeechRecognitionError,
  useSpeechRecognition,
} from "@/hooks/use-speech-recognition";
import { isSpokenMatch, shuffle } from "@/lib/practice";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { PracticeWord } from "@/types/api";

const ROUND_SIZE = 6;
const MAX_ATTEMPTS = 3;

type WordStatus = "idle" | "correct" | "retry" | "failed";

/** Luyện phát âm: đọc từ vào micro, so với kết quả nhận dạng giọng nói; mỗi từ 3 lần thử */
export function SpeakGame({ meta, words, bestScore, skipIntro, onReplay, onSubmitted }: PracticeGameProps) {
  const { speak, stop: stopSpeaking } = useSpeech();
  const { isSupported, isListening, listen, stop: stopListening } = useSpeechRecognition();
  // Từ/cụm ngắn dễ nhận dạng chính xác hơn
  const [items] = useState(() => shuffle(words.filter((w) => w.word.length <= 24)).slice(0, ROUND_SIZE));
  const [phase, setPhase] = useState<GamePhase>(skipIntro && isSupported && items.length > 0 ? "playing" : "intro");
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<WordStatus>("idle");
  const [heard, setHeard] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const missedRef = useRef<PracticeWord[]>([]);

  const item = items[index];
  const isDone = status === "correct" || status === "failed";

  const record = async () => {
    if (isListening) {
      stopListening();
      return;
    }
    if (isDone) return;
    stopSpeaking();
    setMessage(null);
    try {
      const transcripts = await listen();
      if (transcripts.length === 0) {
        // Không nghe thấy gì: không tính là 1 lần thử
        setMessage(RECOGNITION_ERROR_MESSAGES["no-speech"]);
        return;
      }
      setHeard(transcripts[0]);
      if (isSpokenMatch(transcripts, item.word)) {
        playCorrectSound();
        setStatus("correct");
        setCorrectCount((c) => c + 1);
        return;
      }
      playWrongSound();
      const used = attempts + 1;
      setAttempts(used);
      if (used >= MAX_ATTEMPTS) {
        setStatus("failed");
        missedRef.current.push(item);
      } else {
        setStatus("retry");
      }
    } catch (error) {
      if (error instanceof SpeechRecognitionError && error.code !== "aborted") {
        setMessage(RECOGNITION_ERROR_MESSAGES[error.code]);
      }
    }
  };

  const next = (skipped = false) => {
    stopListening();
    if (skipped && !isDone) missedRef.current.push(item);
    if (index + 1 >= items.length) {
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setAttempts(0);
    setStatus("idle");
    setHeard(null);
    setMessage(null);
  };

  const hint = (() => {
    if (message) return message;
    if (isListening) return "Đang nghe… đọc to, rõ nhé";
    if (status === "correct") return "Chuẩn rồi!";
    if (status === "retry") return `Chưa khớp. Thử lại nhé (còn ${MAX_ATTEMPTS - attempts} lần).`;
    if (status === "failed") return "Chưa được rồi. Bấm Nghe mẫu vài lần rồi thử ở lượt sau nhé.";
    return "Bấm micro rồi đọc to từ ở trên";
  })();

  return (
    <PracticeShell
      title={meta.title}
      progress={phase === "done" ? 100 : ((index + (isDone ? 1 : 0)) / items.length) * 100}
      progressLabel={phase === "intro" ? meta.length : `${Math.min(index + 1, items.length)}/${items.length}`}
    >
      {phase === "intro" && (
        <PracticeIntro
          meta={meta}
          bestScore={bestScore}
          onStart={() => setPhase("playing")}
          blockedReason={
            !isSupported
              ? RECOGNITION_ERROR_MESSAGES.unsupported
              : items.length === 0
                ? "Chưa có từ nào phù hợp để luyện phát âm. Học thêm bài để mở khóa nhé."
                : null
          }
        />
      )}

      {phase === "playing" && item && (
        <>
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-4 pt-6 pb-32 text-center">
            <section
              key={item.id}
              className="w-full rounded-[2rem] border border-border/70 bg-card px-6 py-9 shadow-soft animate-in fade-in slide-in-from-right-4 duration-300 motion-reduce:animate-none"
            >
              <p className="text-sm text-muted-foreground">Đọc to từ này</p>
              <p className="mt-2 font-heading text-4xl font-semibold break-words text-primary sm:text-5xl">{item.word}</p>
              {item.phonetic && <p className="mt-1 text-lg text-muted-foreground">{item.phonetic}</p>}
              <p className="mt-3 text-muted-foreground">{item.meaning}</p>
              <Button
                variant="secondary"
                className="mt-5 rounded-full px-4"
                onClick={() => void speak(item.word, { audioUrl: item.audioUrl })}
              >
                <Volume2 className="size-[18px]" />
                Nghe mẫu
              </Button>
            </section>

            <button
              type="button"
              onClick={() => void record()}
              disabled={isDone}
              aria-label={isListening ? "Dừng nghe" : "Bấm để nói"}
              className={cn(
                "relative mt-10 grid size-24 place-items-center rounded-full outline-none transition-transform focus-visible:ring-[3px] focus-visible:ring-ring active:scale-95 disabled:cursor-default",
                status === "correct"
                  ? "bg-success text-success-foreground"
                  : status === "failed"
                    ? "bg-destructive text-white"
                    : "bg-primary text-primary-foreground shadow-[0_18px_34px_-14px_var(--primary)] hover:scale-105",
              )}
            >
              {isListening && (
                <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-primary/40 motion-reduce:animate-none" />
              )}
              {status === "correct" ? (
                <Check className="size-10" strokeWidth={3} />
              ) : status === "failed" ? (
                <X className="size-10" strokeWidth={3} />
              ) : isListening ? (
                <Square className="size-8 fill-current" />
              ) : (
                <Mic className="size-10" />
              )}
            </button>

            <div aria-live="polite" className="mt-5 min-h-16 space-y-1">
              <p
                className={cn(
                  "font-medium",
                  status === "correct" && !message && "text-success",
                  (status === "retry" || status === "failed") && !message && "text-destructive",
                )}
              >
                {hint}
              </p>
              {heard && !isListening && (
                <p className="text-sm text-muted-foreground">
                  Máy nghe được: <span className="font-medium text-foreground">“{heard}”</span>
                </p>
              )}
            </div>
          </div>

          <LessonFooter className="justify-end">
            {isDone ? (
              <Button size="lg" autoFocus className="w-full sm:w-auto sm:min-w-48" onClick={() => next()}>
                {index + 1 >= items.length ? "Xem kết quả" : "Từ tiếp theo"}
              </Button>
            ) : (
              <Button variant="outline" size="lg" className="w-full sm:w-auto sm:min-w-48" onClick={() => next(true)}>
                Bỏ qua
              </Button>
            )}
          </LessonFooter>
        </>
      )}

      {phase === "done" && (
        <PracticeResult
          mode={meta.mode}
          timed={false}
          title="Hoàn thành!"
          summary={`Bạn phát âm đúng ${correctCount}/${items.length} từ.`}
          correct={correctCount}
          total={items.length}
          score={correctCount}
          review={missedRef.current}
          onReplay={onReplay}
          onSubmitted={onSubmitted}
        />
      )}
    </PracticeShell>
  );
}
