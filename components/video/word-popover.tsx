"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, LoaderCircle, Volume2 } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { RatingChips } from "@/components/video/rating-chips";
import { useSpeech } from "@/hooks/use-speech";
import { api, isAbortError } from "@/lib/api-client";
import { wordKey } from "@/lib/word-rating";
import type { WordRating } from "@/types/api";
import type { WordLookupEntry } from "@/types/video";

/** Nghĩa đã tra trong phiên: rê / bấm lại cùng 1 từ không gọi lại API (mức nhớ thì lấy từ trang, luôn mới nhất) */
const entryCache = new Map<string, WordLookupEntry | null>();

/** Rê chuột lên từ chừng này ms mới mở bảng nghĩa (lướt qua thì không mở) */
const HOVER_OPEN_DELAY_MS = 250;
/** Rời chuột chừng này ms mới đóng: đủ thời gian di chuột từ chữ vào bảng nghĩa */
const HOVER_CLOSE_DELAY_MS = 200;

type LookupState = { status: "loading" } | { status: "done"; entry: WordLookupEntry | null } | { status: "error" };

function cambridgeUrl(word: string) {
  return `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(word.toLowerCase())}`;
}

export interface WordRatingsProps {
  /** Mức nhớ đã biết theo wordKey; undefined = chưa biết (tra từ sẽ cho biết) */
  ratings: Record<string, WordRating | null>;
  onRate: (word: string, rating: WordRating | null) => void;
  /** Tra từ xong biết mức nhớ người học đã lưu trước đó */
  onRatingLoaded: (word: string, rating: WordRating | null) => void;
}

interface WordPopoverProps extends WordRatingsProps {
  /** Từ để tra (đã bỏ dấu câu) */
  word: string;
  /** Chữ hiển thị trong câu (có thể kèm dấu câu) */
  children: React.ReactNode;
  /** Trang xem phim dừng video khi bảng nghĩa mở và phát tiếp khi đóng */
  onOpenChange?: (open: boolean) => void;
}

/**
 * 1 từ trong phụ đề. Máy tính: rê chuột lên để xem nghĩa (bấm để giữ bảng mở); điện thoại: chạm để xem.
 * Bảng nghĩa lấy từ bộ từ vựng của app, có nút nghe, chọn mức nhớ để lưu vào lịch ôn và mở từ điển Cambridge.
 */
export function WordPopover({ word, children, onOpenChange, ...ratingProps }: WordPopoverProps) {
  const [open, setOpen] = useState(false);
  /** Bản sao của `open` cho các hẹn giờ (closure của hẹn giờ có thể giữ giá trị cũ) */
  const openRef = useRef(false);
  /** Mở do rê chuột: không chuyển focus vào bảng, rời chuột thì tự đóng */
  const openedByHoverRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function change(next: boolean, byHover = false) {
    window.clearTimeout(timerRef.current);
    openedByHoverRef.current = next && byHover;
    if (openRef.current === next) return;
    openRef.current = next;
    setOpen(next);
    onOpenChange?.(next);
  }

  function schedule(next: boolean, event: React.PointerEvent) {
    if (event.pointerType !== "mouse") return;
    window.clearTimeout(timerRef.current);
    // Bảng đã được giữ mở bằng cách bấm: rời chuột không đóng
    if (!next && openRef.current && !openedByHoverRef.current) return;
    timerRef.current = window.setTimeout(() => change(next, true), next ? HOVER_OPEN_DELAY_MS : HOVER_CLOSE_DELAY_MS);
  }

  return (
    <Popover open={open} onOpenChange={(next) => change(next)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onPointerEnter={(event) => schedule(true, event)}
          onPointerLeave={(event) => schedule(false, event)}
          onClick={(event) => {
            // Đang mở do rê chuột: bấm để giữ bảng mở (không đóng như mặc định)
            if (open && openedByHoverRef.current) {
              event.preventDefault();
              openedByHoverRef.current = false;
            }
          }}
          className="rounded-sm decoration-clay decoration-2 underline-offset-[6px] outline-none hover:bg-clay-soft hover:underline focus-visible:underline data-[state=open]:bg-clay-soft data-[state=open]:underline"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        onOpenAutoFocus={(event) => {
          if (openedByHoverRef.current) event.preventDefault();
        }}
        onPointerEnter={() => window.clearTimeout(timerRef.current)}
        onPointerLeave={(event) => schedule(false, event)}
      >
        {open && <WordDetail word={word} {...ratingProps} />}
      </PopoverContent>
    </Popover>
  );
}

function WordDetail({ word, ratings, onRate, onRatingLoaded }: { word: string } & WordRatingsProps) {
  const key = word.toLowerCase();
  const cached = entryCache.get(key);
  const [state, setState] = useState<LookupState>(
    cached !== undefined ? { status: "done", entry: cached } : { status: "loading" },
  );
  const { speak, isLoading: isSpeaking } = useSpeech();

  // Luôn hỏi server khi chưa biết mức nhớ của từ (kể cả khi đã có nghĩa trong bộ nhớ tạm)
  const entryKey = state.status === "done" && state.entry ? wordKey(state.entry.word) : null;
  const needsRating = entryKey === null || ratings[entryKey] === undefined;

  useEffect(() => {
    if (entryCache.has(key) && !needsRating) return;
    const controller = new AbortController();
    api
      .lookupWord(key, controller.signal)
      .then(({ entry, rating }) => {
        entryCache.set(key, entry);
        setState({ status: "done", entry });
        if (entry) onRatingLoaded(entry.word, rating);
      })
      .catch((error) => {
        if (!isAbortError(error)) setState((current) => (current.status === "done" ? current : { status: "error" }));
      });
    return () => controller.abort();
    // Chỉ tra khi mở bảng cho 1 từ mới (needsRating / onRatingLoaded đổi theo trang, không cần tra lại)
  }, [key]);

  const entry = state.status === "done" ? state.entry : null;
  const headword = entry?.word ?? word;
  const rating = entryKey ? (ratings[entryKey] ?? null) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-2xl leading-tight font-medium break-words">{headword}</p>
          {entry?.phonetic && <p className="font-ipa text-[14px] text-muted-foreground">{entry.phonetic}</p>}
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Nghe phát âm từ ${headword}`}
          onClick={() => void speak(headword)}
        >
          {isSpeaking(headword) ? <LoaderCircle className="animate-spin" /> : <Volume2 />}
        </Button>
      </div>

      {state.status === "loading" ? (
        <p className="flex items-center gap-2 text-[14px] text-muted-foreground">
          <LoaderCircle aria-hidden className="size-4 animate-spin" /> Đang tra nghĩa…
        </p>
      ) : state.status === "error" ? (
        <p className="text-[14px] text-muted-foreground">Không tra được lúc này. Thử mở từ điển bên dưới.</p>
      ) : entry ? (
        <div className="space-y-2">
          <p className="text-[15px] leading-snug font-semibold">{entry.meaning}</p>
          {entry.exampleSentence && (
            <p className="text-[14px] leading-relaxed">
              <span className="italic">{entry.exampleSentence}</span>
              {entry.exampleTranslation && (
                <span className="block text-muted-foreground">{entry.exampleTranslation}</span>
              )}
            </p>
          )}
          <div className="border-t border-line pt-3">
            <p className="text-[12px] font-medium text-muted-foreground">
              {rating ? "Đã lưu vào lịch ôn" : "Lưu để ôn: bạn nhớ từ này đến đâu?"}
            </p>
            <RatingChips className="mt-2" word={headword} rating={rating} onRate={(next) => onRate(headword, next)} />
          </div>
        </div>
      ) : (
        <p className="text-[14px] leading-relaxed text-muted-foreground">Từ này chưa có trong bộ từ vựng của app.</p>
      )}

      <a
        href={cambridgeUrl(headword)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-moss-strong underline-offset-4 hover:underline"
      >
        Tra từ điển Cambridge
        <ExternalLink aria-hidden className="size-3.5" />
      </a>
    </div>
  );
}
