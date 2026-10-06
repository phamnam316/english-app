import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface ToggleChipProps extends Omit<React.ComponentProps<"button">, "onChange"> {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
}

/** Nút bật/tắt dạng viên thuốc (Tiếng Anh, Tiếng Việt, Lặp câu...) */
export function ToggleChip({ pressed, onPressedChange, className, children, ...props }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-medium outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        pressed
          ? "border-moss bg-moss-soft text-moss-strong"
          : "border-line-strong text-muted-foreground hover:bg-card hover:text-foreground",
        className,
      )}
      {...props}
    >
      {pressed && <Check aria-hidden className="size-3.5" strokeWidth={2.5} />}
      {children}
    </button>
  );
}
