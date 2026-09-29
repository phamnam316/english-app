import { cn } from "@/lib/utils";

/**
 * Thanh nút cố định ở đáy màn hình học. Luôn nằm trong tầm ngón cái trên điện thoại
 * và tự chừa vùng an toàn (thanh Home của iPhone).
 */
export function LessonFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/95 backdrop-blur", className)}>
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
        {children}
      </div>
    </div>
  );
}
