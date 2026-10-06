"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Flag,
  Languages,
  LoaderCircle,
  Pause,
  Play,
  Plus,
  Rewind,
  FastForward,
  Save,
  Trash2,
  Undo2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { VideoFrame } from "@/components/video/video-frame";
import { invalidateApiCache } from "@/hooks/use-api-query";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { api, toApiClientError } from "@/lib/api-client";
import { isInsideDialog, isInteractiveTarget, isTypingTarget } from "@/lib/dom";
import { countCues, findActiveCue, formatClockPrecise, parseTranscript, toCues } from "@/lib/videos/subtitles";
import { TRANSLATE_BATCH_SIZE } from "@/lib/videos/validations";
import { cn } from "@/lib/utils";
import type { SubtitleLine, VideoClipDetail } from "@/types/video";

/** Người bấm phím thường chậm hơn lời thoại chừng này giây: trừ đi khi đánh dấu */
const REACTION_SECONDS = 0.2;
const NUDGE_SECONDS = 0.1;
const SEEK_STEP_SECONDS = 2;
const SPEEDS = [1, 0.75, 0.5];
const HISTORY_LIMIT = 100;
const DRAFT_KEY_PREFIX = "video-studio:";

interface Snapshot {
  lines: SubtitleLine[];
  cursor: number;
}

/** Bản nháp tự lưu trong trình duyệt, phòng khi đóng trang trước khi bấm Lưu */
interface Draft {
  lines: SubtitleLine[];
  savedAt: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;
const firstUntimed = (lines: SubtitleLine[]) => {
  const index = lines.findIndex((line) => line.start === null);
  return index === -1 ? lines.length : index;
};

function readDraft(slug: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY_PREFIX + slug);
    const draft = raw ? (JSON.parse(raw) as Draft) : null;
    return draft && Array.isArray(draft.lines) ? draft : null;
  } catch {
    return null;
  }
}

function writeDraft(slug: string, lines: SubtitleLine[] | null) {
  try {
    if (lines) window.localStorage.setItem(DRAFT_KEY_PREFIX + slug, JSON.stringify({ lines, savedAt: Date.now() }));
    else window.localStorage.removeItem(DRAFT_KEY_PREFIX + slug);
  } catch {
    // Trình duyệt chặn lưu trữ (chế độ riêng tư...): chỉ mất tính năng bản nháp
  }
}

/**
 * Trang căn phụ đề (ADMIN): dán lời thoại, dịch tự động sang tiếng Việt, phát video và nhấn Space
 * mỗi khi 1 câu bắt đầu để ghi thời gian, chỉnh từng câu rồi lưu cho người học.
 */
export function SubtitleStudio({ clip }: { clip: VideoClipDetail }) {
  const [lines, setLines] = useState<SubtitleLine[]>(clip.lines);
  /** Câu sẽ được gán thời gian ở lần nhấn Space tiếp theo */
  const [cursor, setCursor] = useState(() => firstUntimed(clip.lines));
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(clip.updatedAt);
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(clip.lines.length === 0);
  const [importText, setImportText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [translateProgress, setTranslateProgress] = useState<{ done: number; total: number } | null>(null);
  const [speed, setSpeed] = useState(1);
  /** Người dùng vừa bấm vào trong khung YouTube: iframe giữ bàn phím nên Space không tới trang */
  const [isFrameFocused, setIsFrameFocused] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);

  const player = useYouTubePlayer({ videoId: clip.youtubeId, startSec: clip.startSec, endSec: clip.endSec });
  const { status, setPlaybackRate } = player;
  useEffect(() => {
    if (status === "ready") setPlaybackRate(speed);
  }, [status, speed, setPlaybackRate]);

  // Có bản nháp chưa lưu khác với bản trên máy chủ: hỏi có khôi phục không
  useEffect(() => {
    const draft = readDraft(clip.slug);
    if (draft && JSON.stringify(draft.lines) !== JSON.stringify(clip.lines)) setPendingDraft(draft);
  }, [clip.slug, clip.lines]);

  useEffect(() => {
    if (isDirty) writeDraft(clip.slug, lines);
  }, [clip.slug, lines, isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  /** Thay đổi có thể hoàn tác (đánh dấu thời gian, xóa câu...) */
  function commit(nextLines: SubtitleLine[], nextCursor = cursor) {
    setHistory((h) => [...h.slice(-(HISTORY_LIMIT - 1)), { lines, cursor }]);
    setLines(nextLines);
    setCursor(Math.max(0, Math.min(nextCursor, nextLines.length)));
    setIsDirty(true);
  }

  function updateLine(index: number, patch: Partial<SubtitleLine>, withHistory = true) {
    const next = lines.map((line, i) => (i === index ? { ...line, ...patch } : line));
    if (withHistory) commit(next);
    else {
      setLines(next);
      setIsDirty(true);
    }
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((h) => h.slice(0, -1));
    setLines(previous.lines);
    setCursor(previous.cursor);
    setIsDirty(true);
  }

  function markStart() {
    const line = lines[cursor];
    if (!line) {
      toast.info("Đã căn tới câu cuối. Bấm vào 1 câu để căn lại từ câu đó.");
      return;
    }
    const start = round2(Math.max(clip.startSec ?? 0, player.getTime() - REACTION_SECONDS));
    commit(
      lines.map((l, i) => (i === cursor ? { ...l, start, end: l.end !== null && l.end > start ? l.end : null } : l)),
      cursor + 1,
    );
  }

  /** Câu vừa đánh dấu kết thúc ở đây (dùng khi sau câu là khoảng lặng dài) */
  function markEnd() {
    const index = cursor - 1;
    const line = lines[index];
    const end = round2(player.getTime() - REACTION_SECONDS);
    if (!line || line.start === null || end <= line.start) {
      toast.info("Nhấn E sau khi đã đánh dấu câu bắt đầu (Space).");
      return;
    }
    commit(lines.map((l, i) => (i === index ? { ...l, end } : l)));
  }

  function nudge(index: number, delta: number) {
    const start = lines[index]?.start;
    if (start === null || start === undefined) return;
    updateLine(index, { start: round2(Math.max(0, start + delta)) });
  }

  function playFrom(index: number) {
    const start = lines[index]?.start;
    if (start === null || start === undefined) return;
    player.seek(start);
    player.play();
  }

  function deleteLine(index: number) {
    commit(
      lines.filter((_, i) => i !== index),
      index < cursor ? cursor - 1 : cursor,
    );
  }

  function insertAfter(index: number) {
    const next = [...lines];
    next.splice(index + 1, 0, { speaker: lines[index]?.speaker ?? "", en: "", vi: "", start: null, end: null });
    commit(next);
  }

  function importTranscript(mode: "replace" | "append") {
    const parsed = parseTranscript(importText);
    if (parsed.length === 0) {
      toast.error("Không đọc được câu nào. Mỗi dòng 1 câu, vd “Grizzly: Hey guys!”.");
      return;
    }
    if (mode === "replace") commit(parsed, 0);
    else commit([...lines, ...parsed], lines.length);
    setImportText("");
    setIsImportOpen(false);
    toast.success(`Đã thêm ${parsed.length} câu.`);
  }

  async function translateMissing() {
    const targets = lines
      .map((line, index) => ({ index, en: line.en.trim() }))
      .filter(({ index, en }) => en && !lines[index].vi.trim());
    if (targets.length === 0) {
      toast.info("Câu nào cũng đã có tiếng Việt.");
      return;
    }

    setHistory((h) => [...h.slice(-(HISTORY_LIMIT - 1)), { lines, cursor }]);
    setTranslateProgress({ done: 0, total: targets.length });
    try {
      for (let i = 0; i < targets.length; i += TRANSLATE_BATCH_SIZE) {
        const batch = targets.slice(i, i + TRANSLATE_BATCH_SIZE);
        const { translations } = await api.translateLines({ lines: batch.map((t) => t.en) });
        // Chỉ điền vào câu vẫn giữ nguyên chữ và chưa có bản dịch (người dùng có thể đã sửa trong lúc chờ)
        setLines((current) =>
          current.map((line, index) => {
            const k = batch.findIndex((t) => t.index === index);
            return k !== -1 && line.en.trim() === batch[k].en && !line.vi.trim() ? { ...line, vi: translations[k] } : line;
          }),
        );
        setIsDirty(true);
        setTranslateProgress({ done: Math.min(i + batch.length, targets.length), total: targets.length });
      }
      toast.success("Đã dịch xong. Đọc lại và sửa những câu chưa tự nhiên trước khi lưu.");
    } catch (error) {
      toast.error(toApiClientError(error).message);
    } finally {
      setTranslateProgress(null);
    }
  }

  async function save() {
    const payload = lines.filter((line) => line.en.trim());
    setIsSaving(true);
    try {
      const result = await api.saveVideoSubtitles(clip.slug, { lines: payload });
      setLines(result.lines);
      setCursor((c) => Math.min(c, result.lines.length));
      setSavedAt(result.updatedAt);
      setIsDirty(false);
      writeDraft(clip.slug, null);
      invalidateApiCache("video");
      toast.success(`Đã lưu ${result.lines.length} câu, ${countCues(result.lines)} câu đã căn thời gian.`);
    } catch (error) {
      toast.error(toApiClientError(error).message);
    } finally {
      setIsSaving(false);
    }
  }

  // Phím tắt: Space đánh dấu câu bắt đầu, E câu kết thúc, K phát / dừng, ← → tua 2 giây, Ctrl+Z hoàn tác
  const shortcutsRef = useRef({ markStart, markEnd, undo, player });
  useEffect(() => {
    shortcutsRef.current = { markStart, markEnd, undo, player };
  });
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || isTypingTarget(event.target) || isInsideDialog(event.target)) return;
      const actions = shortcutsRef.current;
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "z") actions.undo();
      else if (event.ctrlKey || event.metaKey) return;
      else if (key === " ") {
        // Nút vừa bấm chuột vẫn đang focus: bỏ focus để Space không "bấm" thêm nút đó lần nữa
        if (isInteractiveTarget(event.target)) (event.target as HTMLElement).blur();
        actions.markStart();
      }
      else if (key === "e") actions.markEnd();
      else if (key === "k") (actions.player.isPlaying ? actions.player.pause : actions.player.play)();
      else if (key === "arrowleft") actions.player.seek(actions.player.getTime() - SEEK_STEP_SECONDS);
      else if (key === "arrowright") actions.player.seek(actions.player.getTime() + SEEK_STEP_SECONDS);
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    // Trang mất focus vì iframe được bấm vào: activeElement chỉ đổi sau sự kiện blur
    const onBlur = () => setTimeout(() => setIsFrameFocused(document.activeElement?.tagName === "IFRAME"), 0);
    const onFocus = () => setIsFrameFocused(false);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Giữ câu sắp đánh dấu trong tầm nhìn của danh sách
  useEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-line="${cursor}"]`);
    if (!list || !row || list.scrollHeight <= list.clientHeight) return;
    const isVisible = row.offsetTop >= list.scrollTop && row.offsetTop + row.offsetHeight <= list.scrollTop + list.clientHeight;
    if (!isVisible) list.scrollTo({ top: row.offsetTop - list.clientHeight / 3, behavior: "smooth" });
  }, [cursor]);

  const cues = useMemo(() => toCues(lines, clip.endSec), [lines, clip.endSec]);
  const activeCue = cues[findActiveCue(cues, player.time)];
  const activeLine = activeCue?.lineIndex ?? -1;
  const timedCount = countCues(lines);
  const missingVi = lines.filter((line) => line.en.trim() && !line.vi.trim()).length;
  const nextLine = lines[cursor];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5 lg:sticky lg:top-6 lg:self-start">
        <div>
          <Link
            href={`/videos/${clip.slug}`}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:underline"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Về trang xem
          </Link>
          <h1 className="mt-3 text-[1.75rem] leading-[1.15] tracking-[-0.015em]">Căn phụ đề: {clip.title}</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {clip.series} · {clip.episode}
          </p>
        </div>

        {pendingDraft && (
          <div role="status" className="rounded-lg border border-clay bg-clay-soft p-4 text-[14px]">
            <p className="font-semibold">Có bản nháp chưa lưu từ {new Date(pendingDraft.savedAt).toLocaleString("vi-VN")}.</p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  commit(pendingDraft.lines, firstUntimed(pendingDraft.lines));
                  setPendingDraft(null);
                }}
              >
                Khôi phục
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  writeDraft(clip.slug, null);
                  setPendingDraft(null);
                }}
              >
                Bỏ bản nháp
              </Button>
            </div>
          </div>
        )}

        <VideoFrame player={player} youtubeId={clip.youtubeId} title={clip.originalTitle} />

        <div className="flex flex-wrap items-center gap-2">
          <Button size="icon" aria-label={player.isPlaying ? "Dừng (K)" : "Phát (K)"} onClick={player.isPlaying ? player.pause : player.play}>
            {player.isPlaying ? <Pause /> : <Play />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Lùi 2 giây (←)"
            onClick={() => player.seek(player.getTime() - SEEK_STEP_SECONDS)}
          >
            <Rewind />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Tới 2 giây (→)"
            onClick={() => player.seek(player.getTime() + SEEK_STEP_SECONDS)}
          >
            <FastForward />
          </Button>
          <span className="px-1 font-mono text-[14px] tabular-nums">{formatClockPrecise(player.time)}</span>
          <Button
            variant="ghost"
            className="ml-auto tabular-nums"
            onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
          >
            Tốc độ {speed}×
          </Button>
        </div>

        {isFrameFocused && (
          <p role="status" className="rounded-md bg-clay-soft px-3 py-2 text-[14px]">
            Khung video đang giữ bàn phím. Bấm ra chỗ trống bên ngoài khung để dùng Space, E, K.
          </p>
        )}

        <section aria-labelledby="next-line-heading" className="rounded-lg border border-line bg-card p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="next-line-heading" className="font-sans text-[13px] font-semibold tracking-normal text-muted-foreground">
              {nextLine ? `Câu tiếp theo · #${cursor + 1}` : lines.length === 0 ? "Chưa có lời thoại" : "Đã căn tới câu cuối"}
            </h2>
            <span className="text-[13px] text-muted-foreground tabular-nums">
              Đã căn {timedCount}/{lines.length}
            </span>
          </div>
          <p className="mt-2 min-h-14 font-serif text-[1.35rem] leading-snug">
            {nextLine ? (
              <>
                {nextLine.speaker && <span className="text-clay-strong">{nextLine.speaker}: </span>}
                {nextLine.en || <span className="text-muted-foreground">(câu trống)</span>}
              </>
            ) : (
              <span className="text-muted-foreground">
                {lines.length === 0
                  ? "Dán lời thoại vào ô Nhập lời thoại để bắt đầu."
                  : "Bấm số thứ tự của 1 câu trong danh sách để căn lại từ câu đó."}
              </span>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="lg" onClick={markStart} disabled={!nextLine || player.status !== "ready"}>
              <Flag />
              Câu bắt đầu
              <Kbd>Space</Kbd>
            </Button>
            <Button variant="outline" size="lg" onClick={markEnd} disabled={player.status !== "ready" || timedCount === 0}>
              Câu kết thúc
              <Kbd>E</Kbd>
            </Button>
            <Button variant="ghost" size="lg" onClick={undo} disabled={history.length === 0}>
              <Undo2 />
              Hoàn tác
            </Button>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
          <Button onClick={() => void save()} disabled={isSaving || lines.length === 0}>
            {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
            Lưu phụ đề
          </Button>
          <Button variant="outline" onClick={() => void translateMissing()} disabled={translateProgress !== null || missingVi === 0}>
            {translateProgress ? <LoaderCircle className="animate-spin" /> : <Languages />}
            {translateProgress
              ? `Đang dịch ${translateProgress.done}/${translateProgress.total}`
              : `Dịch tự động${missingVi > 0 ? ` (${missingVi})` : ""}`}
          </Button>
          <Button variant="ghost" onClick={() => setIsImportOpen((open) => !open)}>
            <FileText />
            Nhập lời thoại
          </Button>
          <p className="w-full text-[13px] text-muted-foreground" role="status">
            {isDirty
              ? "Có thay đổi chưa lưu (đã giữ bản nháp trong trình duyệt này)."
              : savedAt
                ? `Đã lưu lúc ${new Date(savedAt).toLocaleString("vi-VN")}.`
                : "Clip chưa có phụ đề nào được lưu."}
          </p>
        </div>

        <details className="text-[14px] leading-relaxed text-muted-foreground">
          <summary className="cursor-pointer font-semibold text-foreground">Cách căn phụ đề</summary>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5">
            <li>
              Mở{" "}
              <a href={clip.transcriptUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-moss-strong underline underline-offset-4">
                lời thoại tập này trên We Bare Bears Wiki
              </a>
              , chép đoạn có trong clip rồi dán vào ô Nhập lời thoại. Clip chỉ là 1 phần của tập phim.
            </li>
            <li>Bấm Dịch tự động để điền tiếng Việt, rồi đọc lại và sửa trực tiếp trong danh sách.</li>
            <li>
              Bấm số thứ tự của câu đầu tiên có trong clip, phát video bằng nút Phát của trang (hoặc phím <Kbd>K</Kbd>, đừng bấm
              vào trong khung video) và nhấn <Kbd>Space</Kbd> ngay khi mỗi câu bắt đầu. Câu không có trong clip thì xóa đi.
            </li>
            <li>
              Nếu sau 1 câu là đoạn im lặng dài, nhấn <Kbd>E</Kbd> khi câu đó nói xong. Dùng nút ‹ › để chỉnh lệch 0,1 giây và ▶ để
              nghe lại.
            </li>
            <li>Bấm Lưu phụ đề: người học thấy ngay. Bấm sai thì Hoàn tác (Ctrl+Z).</li>
          </ol>
        </details>
      </div>

      <div className="min-w-0">
        {isImportOpen && (
          <section aria-labelledby="import-heading" className="mb-6 rounded-lg border border-line bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 id="import-heading" className="font-sans text-[15px] font-semibold tracking-normal">
                Nhập lời thoại
              </h2>
              {lines.length > 0 && (
                <Button variant="ghost" size="icon" aria-label="Đóng" className="-mt-2 -mr-2" onClick={() => setIsImportOpen(false)}>
                  <X />
                </Button>
              )}
            </div>
            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
              Mỗi dòng 1 câu, vd <code className="text-foreground">Grizzly: Hey guys!</code>. Phần mô tả trong [ngoặc vuông] tự
              được bỏ. Có sẵn bản dịch thì viết <code className="text-foreground">câu tiếng Anh | bản dịch</code>.{" "}
              <a
                href={clip.transcriptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-moss-strong underline-offset-4 hover:underline"
              >
                Mở lời thoại trên Wiki
                <ExternalLink aria-hidden className="size-3" />
              </a>
            </p>
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              rows={8}
              placeholder={"Grizzly: Hey guys, look at this!\nPanda: What is it?\n[Ice Bear walks in]\nIce Bear: Ice Bear is hungry."}
              aria-label="Lời thoại"
              className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => importTranscript(lines.length > 0 ? "append" : "replace")} disabled={!importText.trim()}>
                {lines.length > 0 ? "Thêm vào cuối" : "Tách thành câu"}
              </Button>
              {lines.length > 0 && (
                <Button variant="outline" onClick={() => importTranscript("replace")} disabled={!importText.trim()}>
                  Thay toàn bộ {lines.length} câu
                </Button>
              )}
            </div>
          </section>
        )}

        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-sans text-[15px] font-semibold tracking-normal">Danh sách câu</h2>
          <span className="text-[13px] text-muted-foreground">Bấm số thứ tự để chọn câu sẽ căn tiếp</span>
        </div>

        {lines.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-line-strong p-6 text-[15px] text-muted-foreground">
            Chưa có câu nào. Dán lời thoại vào ô Nhập lời thoại ở trên.
          </p>
        ) : (
          <ol ref={listRef} className="relative mt-3 max-h-[75dvh] overflow-y-auto border-t-2 border-foreground">
            {lines.map((line, index) => (
              <StudioRow
                key={index}
                index={index}
                line={line}
                isCursor={index === cursor}
                isActive={index === activeLine}
                onSelect={() => setCursor(index)}
                onChange={(patch) => updateLine(index, patch, false)}
                onNudge={(delta) => nudge(index, delta)}
                onClearTime={() => updateLine(index, { start: null, end: null })}
                onPlay={() => playFrom(index)}
                onDelete={() => deleteLine(index)}
                onInsertAfter={() => insertAfter(index)}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-sm border border-current/30 px-1.5 py-px font-sans text-[11px] font-medium opacity-80">{children}</kbd>
  );
}

interface StudioRowProps {
  index: number;
  line: SubtitleLine;
  isCursor: boolean;
  isActive: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<SubtitleLine>) => void;
  onNudge: (delta: number) => void;
  onClearTime: () => void;
  onPlay: () => void;
  onDelete: () => void;
  onInsertAfter: () => void;
}

const cellInput =
  "h-8 w-full min-w-0 rounded-sm border border-transparent bg-transparent px-1.5 text-[14px] outline-none hover:border-line focus-visible:border-ring focus-visible:bg-card";

function StudioRow({
  index,
  line,
  isCursor,
  isActive,
  onSelect,
  onChange,
  onNudge,
  onClearTime,
  onPlay,
  onDelete,
  onInsertAfter,
}: StudioRowProps) {
  const hasTime = line.start !== null;

  return (
    <li
      data-line={index}
      className={cn(
        "group grid grid-cols-[4.75rem_minmax(0,1fr)] gap-x-3 border-b border-l-4 border-b-line border-l-transparent py-2 pr-2 pl-1.5",
        isActive && "bg-moss-soft",
        isCursor && "border-l-clay bg-clay-soft/50",
      )}
    >
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={onSelect}
          aria-label={`Chọn câu ${index + 1} để căn tiếp`}
          aria-pressed={isCursor}
          className="rounded-sm px-1 text-[12px] font-semibold text-muted-foreground tabular-nums outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          #{index + 1}
        </button>
        {hasTime ? (
          <>
            <span className="px-1 font-mono text-[12px] tabular-nums" title={line.end !== null ? `Kết thúc ${formatClockPrecise(line.end)}` : undefined}>
              {formatClockPrecise(line.start!)}
              {line.end !== null && <span className="text-muted-foreground">↦</span>}
            </span>
            <span className="flex items-center">
              <IconButton label="Sớm hơn 0,1 giây" onClick={() => onNudge(-NUDGE_SECONDS)}>
                <ChevronLeft />
              </IconButton>
              <IconButton label="Muộn hơn 0,1 giây" onClick={() => onNudge(NUDGE_SECONDS)}>
                <ChevronRight />
              </IconButton>
              <IconButton label="Nghe từ câu này" onClick={onPlay}>
                <Play />
              </IconButton>
            </span>
          </>
        ) : (
          <span className="px-1 text-[12px] text-muted-foreground">chưa căn</span>
        )}
      </div>

      <div className="min-w-0 space-y-0.5">
        <div className="flex gap-1">
          <input
            value={line.speaker}
            onChange={(event) => onChange({ speaker: event.target.value })}
            placeholder="Người nói"
            aria-label={`Người nói câu ${index + 1}`}
            className={cn(cellInput, "w-24 shrink-0 font-semibold text-clay-strong")}
          />
          <input
            value={line.en}
            onChange={(event) => onChange({ en: event.target.value })}
            placeholder="Câu tiếng Anh"
            aria-label={`Câu tiếng Anh ${index + 1}`}
            aria-invalid={!line.en.trim() || undefined}
            className={cn(cellInput, "aria-invalid:border-destructive/50")}
          />
        </div>
        <input
          value={line.vi}
          onChange={(event) => onChange({ vi: event.target.value })}
          placeholder="Bản dịch tiếng Việt"
          aria-label={`Bản dịch câu ${index + 1}`}
          className={cn(cellInput, "text-muted-foreground")}
        />
        <div className="flex gap-1 opacity-60 group-focus-within:opacity-100 group-hover:opacity-100">
          {hasTime && (
            <button type="button" onClick={onClearTime} className="rounded-sm px-1.5 text-[12px] text-muted-foreground hover:text-foreground">
              Xóa mốc giờ
            </button>
          )}
          <button
            type="button"
            onClick={onInsertAfter}
            className="inline-flex items-center gap-1 rounded-sm px-1.5 text-[12px] text-muted-foreground hover:text-foreground"
          >
            <Plus aria-hidden className="size-3" />
            Chèn câu dưới
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-sm px-1.5 text-[12px] text-muted-foreground hover:text-destructive"
          >
            <Trash2 aria-hidden className="size-3" />
            Xóa câu
          </button>
        </div>
      </div>
    </li>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-panel hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}
