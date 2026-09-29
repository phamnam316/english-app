import { GraduationCap, Rocket, Sprout, type LucideIcon } from "lucide-react";
import type { Level } from "@prisma/client";

import type { CourseSummary } from "@/types/api";
import { LEVEL_META } from "@/lib/ui-constants";
import { cn } from "@/lib/utils";

const LEVEL_ICON: Record<Level, LucideIcon> = {
  BEGINNER: Sprout,
  INTERMEDIATE: Rocket,
  ADVANCED: GraduationCap,
};

interface CourseThumbProps {
  course: Pick<CourseSummary, "level" | "imageUrl">;
  className?: string;
}

/**
 * Ô thumbnail vuông bo góc của khóa học (như thẻ "Course of The Week" trong thiết kế).
 * Chưa có ảnh -> ô màu pastel theo cấp độ + icon + khung CEFR.
 */
export function CourseThumb({ course, className }: CourseThumbProps) {
  const meta = LEVEL_META[course.level];

  if (course.imageUrl) {
    return (
      <div className={cn("relative size-20 shrink-0 overflow-hidden rounded-2xl bg-muted", className)}>
        {/* Ảnh có thể nằm ở bất kỳ domain nào (R2/S3/CDN) -> dùng <img> */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={course.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
      </div>
    );
  }

  const Icon = LEVEL_ICON[course.level];

  return (
    <div
      aria-hidden
      className={cn(
        "relative flex size-20 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl text-tile-foreground",
        meta.tileClass,
        className,
      )}
    >
      <span className="absolute -top-4 -right-4 size-12 rounded-full bg-white/35" />
      <span className="absolute -bottom-5 -left-3 size-10 rounded-full bg-white/25" />
      <Icon className="relative size-7" strokeWidth={1.75} />
      <span className="relative font-heading text-[11px] font-bold tracking-tight">{meta.cefr}</span>
    </div>
  );
}
