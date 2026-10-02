import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  /** Nút / liên kết để làm tiếp */
  action?: React.ReactNode;
  className?: string;
}

/** Trạng thái trống: khung viền đứt, tiêu đề có chân, một câu giải thích và (nếu có) việc nên làm tiếp */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-lg border border-dashed border-line-strong p-6 sm:p-8", className)}>
      <p className="font-serif text-2xl leading-snug font-medium text-balance">{title}</p>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
