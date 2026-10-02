import { cn } from "@/lib/utils";

/**
 * Thanh nút cố định ở đáy màn hình học. Luôn nằm trong tầm ngón cái trên điện thoại
 * và tự chừa vùng an toàn (thanh Home của iPhone).
 */
export function LessonFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card">
      <div
        className={cn(
          "mx-auto flex min-h-20 max-w-[1180px] items-center gap-3 px-4 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-8",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Phím tắt hiển thị trong câu hướng dẫn */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 rounded-sm border border-line-strong bg-paper px-1.5 py-px font-sans text-[11px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}
