import { cn } from "@/lib/utils";

/**
 * Logo: vòng tròn viền mảnh với "Aa" kiểu chữ có chân (ký hiệu quen thuộc của việc học chữ).
 * `inverted`: dùng trên nền tối.
 */
export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border font-serif text-[15px] leading-none",
        inverted ? "border-white/50 text-white" : "border-line-strong text-foreground",
        className,
      )}
    >
      Aa
    </span>
  );
}
