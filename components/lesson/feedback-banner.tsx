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
 * Khung phản hồi hiện ở đáy màn hình sau khi bấm "Kiểm tra" (thay chỗ thanh nút).
 * Đúng: nền xanh nhạt + lời khen. Sai: nền đỏ gạch nhạt + đáp án đúng + giải thích.
 */
export function FeedbackBanner({ isCorrect, praise, correctAnswer, explanation, onContinue }: FeedbackBannerProps) {
  return (
    <div
      role="status"
      aria-live="assertive"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t-2 bg-card animate-in slide-in-from-bottom-4 fade-in duration-200 ease-out motion-reduce:animate-none",
        isCorrect ? "border-success" : "border-destructive",
      )}
    >
      {/* Lớp màu nhạt đặt trên nền đặc: ở chế độ tối màu nhạt có độ trong, không để nội dung trang lộ qua */}
      <div aria-hidden className={cn("absolute inset-0", isCorrect ? "bg-success-soft" : "bg-danger-soft")} />

      <div className="relative mx-auto flex max-w-[1180px] flex-col gap-4 px-4 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8">
        <div className="flex gap-3.5">
          <span
            aria-hidden
            className={cn(
              "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-white",
              isCorrect ? "bg-success dark:text-success-foreground" : "bg-destructive dark:text-background",
            )}
          >
            {isCorrect ? <Check className="size-[18px]" strokeWidth={3} /> : <X className="size-[18px]" strokeWidth={3} />}
          </span>

          <div className="min-w-0 space-y-1">
            <p className={cn("text-lg font-semibold", isCorrect ? "text-success" : "text-destructive")}>
              {isCorrect ? praise : "Chưa đúng rồi"}
            </p>
            {!isCorrect && (
              <p className="text-[15px]">
                Đáp án đúng: <b className="font-semibold">{correctAnswer}</b>
              </p>
            )}
            {explanation && <p className="text-[14px] leading-relaxed text-muted-foreground">{explanation}</p>}
          </div>
        </div>

        <Button autoFocus size="lg" onClick={onContinue} className="w-full shrink-0 sm:w-auto sm:min-w-48">
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}
