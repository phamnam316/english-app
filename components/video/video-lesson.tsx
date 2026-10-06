"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Pause, Play, RotateCcw, SkipBack, SkipForward, SlidersHorizontal } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ClipVocabulary } from "@/components/video/clip-vocabulary";
import { ToggleChip } from "@/components/video/toggle-chip";
import { VideoFrame } from "@/components/video/video-frame";
import { WordPopover, type WordRatingsProps } from "@/components/video/word-popover";
import { invalidateApiCache } from "@/hooks/use-api-query";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { api, toApiClientError } from "@/lib/api-client";
import { isInsideDialog, isInteractiveTarget, isTypingTarget } from "@/lib/dom";
import { youtubeWatchUrl } from "@/lib/videos/catalog";
import {
  findActiveCue,
  findLastStartedCue,
  formatClock,
  toCues,
  tokenizeWords,
  type SubtitleCue,
} from "@/lib/videos/subtitles";
import { cn } from "@/lib/utils";
import { wordKey } from "@/lib/word-rating";
import type { WordRating } from "@/types/api";
import type { ClipWord, VideoClipDetail } from "@/types/video";

/** Bấm nút tốc độ để xoay vòng các mức này */
const SPEEDS = [1, 0.75, 0.5];

/** Sau khi dừng ở cuối câu, thời điểm còn trong chừng này giây sau câu thì vẫn coi là đang ở câu đó */
const FOCUS_GRACE_SECONDS = 1;
/** Đóng bảng nghĩa rồi chừng này ms mới phát tiếp: rê sang từ bên cạnh thì video vẫn dừng */
const RESUME_DELAY_MS = 350;

interface VideoLessonProps {
  clip: VideoClipDetail;
  vocabulary: ClipWord[];
  canEdit: boolean;
}

/**
 * Xem 1 clip với phụ đề song ngữ: câu đang nói hiện to dưới video (rê chuột / chạm vào từ để tra nghĩa và lưu từ),
 * nút câu trước / phát lại / câu sau, lặp câu, tự dừng sau mỗi câu, tốc độ chậm, lời thoại và từ vựng của clip.
 */
export function VideoLesson({ clip, vocabulary, canEdit }: VideoLessonProps) {
  const cues = useMemo(() => toCues(clip.lines, clip.endSec), [clip.lines, clip.endSec]);
  const [showEn, setShowEn] = useState(true);
  const [showVi, setShowVi] = useState(true);
  const [loop, setLoop] = useState(false);
  const [autoPause, setAutoPause] = useState(false);
  const [speed, setSpeed] = useState(1);
  /** Câu người học đang ở (hiện to dưới video, là mốc của các nút câu trước / sau); -1 = chưa tới câu nào */
  const [focus, setFocus] = useState(-1);
  /** Câu tiếng Anh được bấm hiện tạm khi đang ẩn phụ đề tiếng Anh */
  const [revealed, setRevealed] = useState(-1);
  /** Câu đang phát: để lặp lại hoặc dừng đúng lúc câu kết thúc */
  const playingCueRef = useRef(-1);
  const [panel, setPanel] = useState<"transcript" | "vocabulary">("transcript");
  /** Mức nhớ các từ theo wordKey (từ danh sách từ vựng của clip và các từ đã tra) */
  const [ratings, setRatings] = useState<Record<string, WordRating | null>>(() =>
    Object.fromEntries(vocabulary.map((item) => [wordKey(item.word), item.rating])),
  );
  /** Video đang phát thì bị dừng khi mở bảng nghĩa: đóng bảng thì phát tiếp */
  const resumeAfterWordRef = useRef(false);
  const resumeTimerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(resumeTimerRef.current), []);

  const player = useYouTubePlayer({
    videoId: clip.youtubeId,
    startSec: clip.startSec,
    endSec: clip.endSec,
    onTick: (time, isPlaying) => {
      const playingIndex = playingCueRef.current;
      const playingCue = cues[playingIndex];
      // Vừa qua cuối câu đang phát (không phải tua xa): lặp lại hoặc tự dừng
      if (isPlaying && playingCue && time >= playingCue.end && time < playingCue.end + FOCUS_GRACE_SECONDS) {
        if (loop) {
          player.seek(playingCue.start);
          return;
        }
        if (autoPause) {
          playingCueRef.current = -1;
          player.pause();
          return;
        }
      }

      const active = findActiveCue(cues, time);
      if (isPlaying) playingCueRef.current = active;

      const focusCue = cues[focus];
      const nearFocus =
        !!focusCue && time >= focusCue.start - 0.05 && time <= focusCue.end + FOCUS_GRACE_SECONDS;
      // Đang phát: theo câu đang nói. Đang dừng: chỉ đổi câu khi người học tua đi chỗ khác
      if (active !== -1 && active !== focus && (isPlaying || !nearFocus)) setFocus(active);
      else if (active === -1 && !isPlaying && !nearFocus) setFocus(findLastStartedCue(cues, time));
    },
  });

  const { status, setPlaybackRate } = player;
  useEffect(() => {
    if (status === "ready") setPlaybackRate(speed);
  }, [status, speed, setPlaybackRate]);

  function goToCue(index: number) {
    const cue = cues[index];
    if (!cue) return;
    playingCueRef.current = index;
    setFocus(index);
    player.seek(cue.start);
    player.play();
  }

  function playFrom(start: number) {
    const index = cues.findIndex((cue) => cue.start === start);
    if (index !== -1) goToCue(index);
  }

  function handleWordOpenChange(open: boolean) {
    window.clearTimeout(resumeTimerRef.current);
    if (open) {
      if (player.isPlaying) {
        resumeAfterWordRef.current = true;
        player.pause();
      }
    } else if (resumeAfterWordRef.current) {
      resumeTimerRef.current = window.setTimeout(() => {
        resumeAfterWordRef.current = false;
        player.play();
      }, RESUME_DELAY_MS);
    }
  }

  async function rateWord(word: string, rating: WordRating | null) {
    const key = wordKey(word);
    const previous = ratings[key] ?? null;
    setRatings((current) => ({ ...current, [key]: rating }));
    try {
      await api.rateWord({ word, rating });
      invalidateApiCache("home", "practice", "video:");
      if (rating !== null && previous === null) toast.success(`Đã lưu “${word}”: từ sẽ có trong phần ôn tập.`);
    } catch (error) {
      setRatings((current) => ({ ...current, [key]: previous }));
      toast.error(toApiClientError(error).message);
    }
  }

  const wordRatings: WordRatingsProps = {
    ratings,
    onRate: (word, rating) => void rateWord(word, rating),
    onRatingLoaded: (word, rating) =>
      setRatings((current) => (wordKey(word) in current ? current : { ...current, [wordKey(word)]: rating })),
  };

  const goPrevious = () => goToCue(Math.max(0, focus - 1));
  const replay = () => goToCue(Math.max(0, focus));
  const goNext = () => goToCue(Math.min(cues.length - 1, focus + 1));
  const togglePlay = () => (player.isPlaying ? player.pause() : player.play());

  // Phím tắt: ← câu trước, → câu sau, R phát lại câu, Space / K phát - dừng
  const shortcutsRef = useRef({ goPrevious, replay, goNext, togglePlay });
  useEffect(() => {
    shortcutsRef.current = { goPrevious, replay, goNext, togglePlay };
  });
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target) || isInsideDialog(event.target)) return;
      const actions = shortcutsRef.current;
      const key = event.key.toLowerCase();
      if (key === "arrowleft") actions.goPrevious();
      else if (key === "arrowright") actions.goNext();
      else if (key === "r") actions.replay();
      // Space trên nút đang focus là bấm nút đó, không phải phát / dừng
      else if (key === "k" || (key === " " && !isInteractiveTarget(event.target))) actions.togglePlay();
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const hasCues = cues.length > 0;
  const currentCue = cues[focus];
  const isSpeaking = focus !== -1 && findActiveCue(cues, player.time) === focus;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/videos"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:underline"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Tất cả video
          </Link>
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/videos/${clip.slug}/studio`}>
                <SlidersHorizontal />
                Căn phụ đề
              </Link>
            </Button>
          )}
        </div>

        <h1 className="mt-4 text-[2rem] leading-[1.1] tracking-[-0.015em] sm:text-[2.5rem]">{clip.title}</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          {clip.series} · {clip.episode} · {formatClock(clip.durationSec)}
        </p>

        <div className="mt-6">
          <VideoFrame player={player} youtubeId={clip.youtubeId} title={clip.originalTitle} />
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted-foreground">
          Video từ kênh YouTube chính thức của {clip.series} (Cartoon Network).
          <a
            href={youtubeWatchUrl(clip.youtubeId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:text-foreground hover:underline"
          >
            Mở trên YouTube
            <ExternalLink aria-hidden className="size-3" />
          </a>
        </p>

        {hasCues ? (
          <>
            <CurrentCue
              cue={currentCue}
              isSpeaking={isSpeaking}
              showEn={showEn || revealed === focus}
              showVi={showVi}
              onReveal={() => setRevealed(focus)}
              onWordOpenChange={handleWordOpenChange}
              wordRatings={wordRatings}
            />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Câu trước (phím ←)" onClick={goPrevious}>
                <SkipBack />
              </Button>
              <Button size="icon" aria-label={player.isPlaying ? "Dừng (phím K)" : "Phát (phím K)"} onClick={togglePlay}>
                {player.isPlaying ? <Pause /> : <Play />}
              </Button>
              <Button variant="outline" size="icon" aria-label="Câu sau (phím →)" onClick={goNext}>
                <SkipForward />
              </Button>
              <Button variant="outline" onClick={replay}>
                <RotateCcw />
                Phát lại câu
              </Button>
              <Button
                variant="ghost"
                className="tabular-nums"
                aria-label={`Tốc độ phát ${speed}x, bấm để đổi`}
                onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
              >
                Tốc độ {speed}×
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Tùy chọn phụ đề">
              <ToggleChip pressed={showEn} onPressedChange={setShowEn}>
                Tiếng Anh
              </ToggleChip>
              <ToggleChip pressed={showVi} onPressedChange={setShowVi}>
                Tiếng Việt
              </ToggleChip>
              <ToggleChip
                pressed={loop}
                onPressedChange={(next) => {
                  setLoop(next);
                  if (next) setAutoPause(false);
                }}
              >
                Lặp câu
              </ToggleChip>
              <ToggleChip
                pressed={autoPause}
                onPressedChange={(next) => {
                  setAutoPause(next);
                  if (next) setLoop(false);
                }}
              >
                Tự dừng sau mỗi câu
              </ToggleChip>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              Rê chuột (điện thoại: chạm) vào 1 từ trong phụ đề để xem nghĩa và lưu từ để ôn; video tạm dừng trong lúc xem.
              Luyện nghe: tắt Tiếng Anh, bật Tự dừng sau mỗi câu, đoán câu vừa nghe rồi bấm để xem lại. Phím tắt: ← → chuyển
              câu, R phát lại, K phát / dừng.
            </p>
          </>
        ) : (
          <EmptyState
            className="mt-6"
            title="Clip này chưa có phụ đề song ngữ"
            description="Bạn vẫn xem được video: bấm nút CC trong khung phát để bật phụ đề tự động của YouTube. Phụ đề song ngữ và các nút luyện nghe sẽ có khi quản trị viên căn xong lời thoại."
            action={
              canEdit ? (
                <Button asChild>
                  <Link href={`/videos/${clip.slug}/studio`}>
                    <SlidersHorizontal />
                    Căn phụ đề cho clip này
                  </Link>
                </Button>
              ) : undefined
            }
          />
        )}
      </div>

      {hasCues && (
        <aside aria-label="Lời thoại và từ vựng" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <div role="tablist" aria-label="Nội dung bên cạnh video" className="flex gap-6 border-b border-line">
            {(
              [
                { value: "transcript", label: `Lời thoại (${cues.length})` },
                { value: "vocabulary", label: `Từ vựng (${vocabulary.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={panel === tab.value}
                onClick={() => setPanel(tab.value)}
                className={cn(
                  "relative -mb-px pb-2.5 text-[15px] outline-none focus-visible:underline",
                  panel === tab.value
                    ? "font-semibold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-clay"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {panel === "transcript" ? (
            <Transcript cues={cues} focus={focus} showEn={showEn} showVi={showVi} onSelect={goToCue} />
          ) : (
            <ClipVocabulary
              words={vocabulary}
              ratings={ratings}
              onRate={(word, rating) => void rateWord(word, rating)}
              onPlaySentence={playFrom}
            />
          )}
        </aside>
      )}
    </div>
  );
}

interface CurrentCueProps {
  cue: SubtitleCue | undefined;
  isSpeaking: boolean;
  showEn: boolean;
  showVi: boolean;
  onReveal: () => void;
  onWordOpenChange: (open: boolean) => void;
  wordRatings: WordRatingsProps;
}

/** Câu đang nói, chữ to; rê chuột / chạm vào từng từ tiếng Anh để tra nghĩa */
function CurrentCue({ cue, isSpeaking, showEn, showVi, onReveal, onWordOpenChange, wordRatings }: CurrentCueProps) {
  return (
    <section
      aria-label="Phụ đề"
      aria-live="polite"
      className="mt-5 flex min-h-36 flex-col justify-center rounded-lg border border-line bg-card px-5 py-5 sm:px-7"
    >
      {!cue ? (
        <p className="text-[15px] text-muted-foreground">Bấm phát video. Phụ đề hiện ở đây khi nhân vật bắt đầu nói.</p>
      ) : (
        <div className={cn("transition-opacity", !isSpeaking && "opacity-70")}>
          {cue.speaker && (
            <p className="text-[12px] font-semibold tracking-[0.08em] text-clay-strong uppercase">{cue.speaker}</p>
          )}
          {showEn ? (
            <p className="mt-1 font-serif text-[1.5rem] leading-snug sm:text-[1.75rem]">
              {tokenizeWords(cue.en).map((token, i) =>
                token.word ? (
                  <WordPopover key={i} word={token.word} onOpenChange={onWordOpenChange} {...wordRatings}>
                    {token.text}
                  </WordPopover>
                ) : (
                  <span key={i}>{token.text}</span>
                ),
              )}
            </p>
          ) : (
            <button
              type="button"
              onClick={onReveal}
              className="mt-1 w-full rounded-md border border-dashed border-line-strong px-4 py-3 text-left text-[15px] text-muted-foreground outline-none hover:bg-panel focus-visible:outline-2 focus-visible:outline-ring"
            >
              Đã ẩn câu tiếng Anh. Nghe rồi đoán, sau đó bấm vào đây để xem.
            </button>
          )}
          {showVi && cue.vi && <p className="mt-2 text-[16px] leading-relaxed text-muted-foreground">{cue.vi}</p>}
        </div>
      )}
    </section>
  );
}

interface TranscriptProps {
  cues: SubtitleCue[];
  focus: number;
  showEn: boolean;
  showVi: boolean;
  onSelect: (index: number) => void;
}

/** Toàn bộ lời thoại: câu đang ở được tô và tự cuộn tới; bấm 1 câu để phát từ câu đó */
function Transcript({ cues, focus, showEn, showVi, onSelect }: TranscriptProps) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-cue="${focus}"]`);
    if (!list || !row || list.scrollHeight <= list.clientHeight) return;
    const isVisible = row.offsetTop >= list.scrollTop && row.offsetTop + row.offsetHeight <= list.scrollTop + list.clientHeight;
    if (!isVisible) list.scrollTo({ top: row.offsetTop - list.clientHeight / 3, behavior: "smooth" });
  }, [focus]);

  return (
    <div role="tabpanel" aria-label="Lời thoại">
      <ol
        ref={listRef}
        className="relative mt-3 max-h-[28rem] overflow-y-auto border-t-2 border-foreground lg:max-h-[calc(100dvh-10rem)]"
      >
        {cues.map((cue, index) => (
          <li key={`${cue.lineIndex}-${cue.start}`} data-cue={index} className="border-b border-line">
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === focus ? "true" : undefined}
              className={cn(
                "flex w-full gap-3 px-2 py-2.5 text-left outline-none hover:bg-card focus-visible:bg-card focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                index === focus && "bg-moss-soft hover:bg-moss-soft",
              )}
            >
              <span className="w-10 shrink-0 pt-0.5 text-[12px] text-muted-foreground tabular-nums">
                {formatClock(cue.start)}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[15px] leading-snug", !showEn && "blur-[5px] select-none")}>
                  {cue.speaker && <span className="font-semibold text-clay-strong">{cue.speaker}: </span>}
                  {cue.en}
                </span>
                {showVi && cue.vi && (
                  <span className="mt-0.5 block text-[14px] leading-snug text-muted-foreground">{cue.vi}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
        Lời thoại tham khảo từ We Bare Bears Wiki; bản dịch tiếng Việt dành cho việc học.
      </p>
    </div>
  );
}
