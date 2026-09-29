import { cn } from "@/lib/utils";

/**
 * Logo: vòng tròn với "Aa" (ký hiệu quen thuộc của việc học chữ), như logo tròn của thiết kế.
 * `inverted`: dùng trên nền tím (vòng trắng, chữ tím).
 */
export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full font-heading text-sm font-bold tracking-tight",
        inverted ? "bg-white text-primary" : "bg-primary text-primary-foreground",
        className,
      )}
    >
      Aa
    </span>
  );
}
