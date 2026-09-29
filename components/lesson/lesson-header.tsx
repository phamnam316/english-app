"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { selectLessonProgress, useLessonStore } from "@/store/useLessonStore";

/** Header màn học: nút thoát (có hỏi xác nhận) + thanh tiến độ tăng theo số bước đã xong */
export function LessonHeader() {
  const router = useRouter();
  const progress = useLessonStore(selectLessonProgress);
  const phase = useLessonStore((s) => s.phase);
  const courseId = useLessonStore((s) => s.lesson?.course.id);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const exit = () => router.push(courseId ? `/courses/${courseId}` : "/dashboard");

  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Thoát bài học"
          className="size-10 text-muted-foreground"
          onClick={() => (phase === "completed" ? exit() : setIsConfirmOpen(true))}
        >
          <X className="size-6" />
        </Button>
        <Progress value={progress} aria-label="Tiến độ bài học" className="h-2.5 flex-1" />
        <span className="w-11 text-right text-sm font-semibold text-muted-foreground tabular-nums">{progress}%</span>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent showCloseButton={false} className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thoát bài học?</DialogTitle>
            <DialogDescription>
              Kết quả của lần học này sẽ không được lưu. Lần sau bạn sẽ học lại bài này từ đầu.
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
