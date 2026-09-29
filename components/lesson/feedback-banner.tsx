"use client";

import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeedbackBannerProps {
  isCorrect: boolean;
  praise: string;
  correctAnswer: string;
  explanation: string | null;
  onContinue: () => void;
}

/**
 * Banner phản hồi trượt lên từ đáy màn hình sau khi bấm "Kiểm tra".
 * Đúng: nền xanh + lời khen. Sai: nền đỏ (như bút phê của giáo viên) + đáp án đúng + giải thích.
 */
export function FeedbackBanner({ isCorrect, praise, correctAnswer, explanation, onContinue }: FeedbackBannerProps) {
  return (
    <div
      role="status"
      aria-live="assertive"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 overflow-hidden rounded-t-[2rem] border-t-2 bg-background shadow-[0_-16px_40px_-20px_rgb(38_31_90/0.35)] animate-in slide-in-from-bottom duration-300 ease-out motion-reduce:animate-none",
        isCorrect ? "border-success/30" : "border-destructive/30",
      )}
    >
      {/* Lớp màu nhạt đặt trên nền đặc: ở chế độ tối màu soft có độ trong suốt, không để nội dung trang lộ qua */}
      <div aria-hidden className={cn("absolute inset-0 -z-10", isCorrect ? "bg-success-soft" : "bg-danger-soft")} />

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6">
        <div className="flex gap-3.5">
          <span
            aria-hidden
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-full",
              isCorrect ? "bg-success text-success-foreground" : "bg-destructive text-white",
            )}
          >
            {isCorrect ? <Check className="size-6" strokeWidth={3} /> : <X className="size-6" strokeWidth={3} />}
          </span>

          <div className="min-w-0 space-y-1">
            <p className={cn("font-heading text-xl font-bold", isCorrect ? "text-success" : "text-destructive")}>
              {isCorrect ? praise : "Chưa đúng rồi"}
            </p>
            {!isCorrect && (
              <p className="font-semibold text-destructive">
                Đáp án đúng: <span className="font-bold">{correctAnswer}</span>
              </p>
            )}
            {explanation && (
              <p className={cn("text-sm leading-relaxed", isCorrect ? "text-success" : "text-destructive")}>{explanation}</p>
            )}
          </div>
        </div>

        <Button
          autoFocus
          size="lg"
          onClick={onContinue}
          className={cn(
            "w-full shrink-0 sm:w-auto sm:min-w-40",
            isCorrect
              ? "bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success/35"
              : "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/35",
          )}
        >
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}
