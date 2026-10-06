"use client";

import { useEffect, useState } from "react";
import { ExternalLink, LoaderCircle, Volume2 } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";
import { api, isAbortError } from "@/lib/api-client";
import type { WordLookupEntry } from "@/types/video";

/** Kết quả tra đã có trong phiên: bấm lại cùng 1 từ không gọi lại API */
const lookupCache = new Map<string, WordLookupEntry | null>();

type LookupState = { status: "loading" } | { status: "done"; entry: WordLookupEntry | null } | { status: "error" };

function cambridgeUrl(word: string) {
  return `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(word.toLowerCase())}`;
}

interface WordPopoverProps {
  /** Từ để tra (đã bỏ dấu câu) */
  word: string;
  /** Chữ hiển thị trong câu (có thể kèm dấu câu) */
  children: React.ReactNode;
  /** Mở bảng nghĩa: trang xem phim dừng video để người học đọc */
  onOpen?: () => void;
}

/** 1 từ trong phụ đề: bấm để xem nghĩa (bộ từ vựng của app), nghe phát âm hoặc mở từ điển Cambridge */
export function WordPopover({ word, children, onOpen }: WordPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) onOpen?.();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded-sm decoration-clay decoration-2 underline-offset-[6px] outline-none hover:underline focus-visible:underline data-[state=open]:bg-clay-soft data-[state=open]:underline"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">{open && <WordDetail word={word} />}</PopoverContent>
    </Popover>
  );
}

function WordDetail({ word }: { word: string }) {
  const key = word.toLowerCase();
  const cached = lookupCache.get(key);
  const [state, setState] = useState<LookupState>(
    cached !== undefined ? { status: "done", entry: cached } : { status: "loading" },
  );
  const { speak, isLoading: isSpeaking } = useSpeech();

  useEffect(() => {
    if (lookupCache.has(key)) return;
    const controller = new AbortController();
    api
      .lookupWord(key, controller.signal)
      .then(({ entry }) => {
        lookupCache.set(key, entry);
        setState({ status: "done", entry });
      })
      .catch((error) => {
        if (!isAbortError(error)) setState({ status: "error" });
      });
    return () => controller.abort();
  }, [key]);

  const entry = state.status === "done" ? state.entry : null;
  const headword = entry?.word ?? word;

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
