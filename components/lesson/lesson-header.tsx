"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { selectLessonProgress, useLessonStore } from "@/store/useLessonStore";

/** Header màn học: nút thoát (có hỏi xác nhận), vị trí bài trong khóa và thanh tiến độ của cả bài */
export function LessonHeader() {
  const router = useRouter();
  const progress = useLessonStore(selectLessonProgress);
  const { phase, lesson } = useLessonStore(useShallow((s) => ({ phase: s.phase, lesson: s.lesson })));
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const exit = () => router.push(lesson ? `/courses/${lesson.course.id}` : "/dashboard");

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-3 px-2 sm:gap-5 sm:px-8">
        <button
          type="button"
          aria-label="Thoát bài học"
          onClick={() => (phase === "completed" ? exit() : setIsConfirmOpen(true))}
          className="grid size-10 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-line/60 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X className="size-5" />
        </button>
        {lesson && (
          <p className="min-w-0 flex-1 truncate text-[15px]">
            <span className="hidden text-muted-foreground sm:inline">
              Chương {lesson.unit.order} / Bài {lesson.order} —{" "}
            </span>
            <b className="font-semibold">{lesson.title}</b>
          </p>
        )}
        <div className="ml-auto flex w-28 shrink-0 items-center gap-3 sm:w-64">
          <div
            role="progressbar"
            aria-label="Tiến độ bài học"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-[5px] flex-1 overflow-hidden rounded-full bg-line"
          >
            <div className="h-full rounded-full bg-moss transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="w-10 text-right text-sm font-semibold text-muted-foreground tabular-nums">{progress}%</span>
        </div>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium">Thoát bài học?</DialogTitle>
            <DialogDescription>
              Kết quả của lần học này sẽ không được lưu. Lần sau bạn sẽ học lại bài này từ đầu. Mức nhớ bạn đã chọn cho từng
              từ vẫn được giữ.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={exit}>
              Thoát
            </Button>
            <Button onClick={() => setIsConfirmOpen(false)}>Học tiếp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
