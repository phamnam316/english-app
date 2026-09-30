"use client";

import { cn } from "@/lib/utils";

interface WordChipsProps {
  /** Tất cả thẻ từ theo thứ tự trong kho (đã xáo) */
  chips: string[];
  /** Vị trí (trong `chips`) của các thẻ đã xếp vào câu, theo thứ tự trong câu */
  selected: number[];
  onChange: (selected: number[]) => void;
  disabled?: boolean;
  /** Sau khi kiểm tra: tô xanh/đỏ vùng câu trả lời */
  isCorrect?: boolean;
}

/**
 * Xếp thẻ từ thành câu: chạm thẻ trong kho để thêm vào câu, chạm thẻ trong câu để bỏ ra.
 * Thẻ đã dùng để lại ô trống trong kho để bố cục không nhảy khi chạm liên tục.
 */
export function WordChips({ chips, selected, onChange, disabled = false, isCorrect }: WordChipsProps) {
  const used = new Set(selected);

  return (
    <div className="space-y-6">
      <div
        aria-label="Câu của bạn"
        className={cn(
          "flex min-h-28 flex-wrap content-start gap-2 rounded-3xl border-2 border-dashed p-3 transition-colors",
          isCorrect === undefined && "border-border bg-surface-soft",
          isCorrect === true && "border-success bg-success-soft",
          isCorrect === false && "border-destructive bg-danger-soft",
        )}
      >
        {selected.length === 0 ? (
          <p className="self-center px-2 text-sm text-muted-foreground">Chạm các thẻ bên dưới để ghép câu</p>
        ) : (
          selected.map((chipIndex, position) => (
            <Chip
              key={chipIndex}
              disabled={disabled}
              label={`${chips[chipIndex]}, chạm để bỏ khỏi câu`}
              onClick={() => onChange(selected.filter((_, i) => i !== position))}
            >
              {chips[chipIndex]}
            </Chip>
          ))
        )}
      </div>

      <div role="group" aria-label="Các thẻ từ" className="flex flex-wrap justify-center gap-2">
        {chips.map((chip, index) =>
          used.has(index) ? (
            <span
              key={index}
              aria-hidden
              className="rounded-xl border-2 border-dashed border-border px-3.5 py-2 text-base font-medium text-transparent select-none"
            >
              {chip}
            </span>
          ) : (
            <Chip key={index} disabled={disabled} onClick={() => onChange([...selected, index])}>
              {chip}
            </Chip>
          ),
        )}
      </div>
    </div>
  );
}

function Chip({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label?: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl border-2 border-border bg-card px-3.5 py-2 text-base font-medium shadow-[0_3px_0_0_var(--border)] outline-none transition-transform hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:translate-y-0.5 active:shadow-none disabled:cursor-default disabled:hover:border-border"
    >
      {children}
    </button>
  );
}
