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
 * Xếp thẻ từ thành câu: chạm thẻ trong kho để thêm vào câu (dòng kẻ phía trên), chạm thẻ trong câu để bỏ ra.
 * Thẻ đã dùng để lại ô trống trong kho để bố cục không nhảy khi chạm liên tục.
 */
export function WordChips({ chips, selected, onChange, disabled = false, isCorrect }: WordChipsProps) {
  const used = new Set(selected);

  return (
    <div>
      <div
        aria-label="Câu của bạn"
        className={cn(
          "flex min-h-16 flex-wrap items-end gap-1.5 border-b-2 px-1 pb-2 transition-colors",
          isCorrect === undefined && "border-foreground",
          isCorrect === true && "rounded-t-md border-success bg-success-soft pt-2",
          isCorrect === false && "rounded-t-md border-destructive bg-danger-soft pt-2",
        )}
      >
        {selected.length === 0 ? (
          <p className="pb-1.5 text-[14px] text-muted-foreground">Chạm các thẻ bên dưới để ghép câu</p>
        ) : (
          selected.map((chipIndex, position) => (
            <Chip
              key={chipIndex}
              disabled={disabled}
              label={`${chips[chipIndex]}, chạm để bỏ khỏi câu`}
              className="bg-card"
              onClick={() => onChange(selected.filter((_, i) => i !== position))}
            >
              {chips[chipIndex]}
            </Chip>
          ))
        )}
      </div>

      <div role="group" aria-label="Các thẻ từ" className="mt-5 flex flex-wrap gap-2">
        {chips.map((chip, index) =>
          used.has(index) ? (
            <span
              key={index}
              aria-hidden
              className="rounded-md border border-dashed border-line px-3 py-2 text-base font-medium text-transparent select-none"
            >
              {chip}
            </span>
          ) : (
            <Chip key={index} disabled={disabled} className="bg-paper" onClick={() => onChange([...selected, index])}>
              {chip}
            </Chip>
          ),
        )}
      </div>
      {selected.length > 0 && !disabled && (
        <p className="mt-3 text-[13px] text-muted-foreground">Chạm thẻ trong câu để bỏ ra.</p>
      )}
    </div>
  );
}

function Chip({
  children,
  label,
  disabled,
  className,
  onClick,
}: {
  children: React.ReactNode;
  label?: string;
  disabled: boolean;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md border border-line-strong px-3 py-2 text-base font-medium shadow-[0_1px_0_var(--line-strong)] outline-none transition-colors hover:border-moss focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:translate-y-px active:shadow-none disabled:cursor-default disabled:hover:border-line-strong",
        className,
      )}
    >
      {children}
    </button>
  );
}
