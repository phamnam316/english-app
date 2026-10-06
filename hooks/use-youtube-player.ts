"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Phần của YouTube IFrame Player API mà app dùng: https://developers.google.com/youtube/iframe_api_reference */
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  setPlaybackRate(rate: number): void;
  destroy(): void;
}

interface YTPlayerOptions {
  host?: string;
  videoId: string;
  width?: string;
  height?: string;
  playerVars?: Record<string, string | number | undefined>;
  events?: {
    onReady?: () => void;
    onStateChange?: (event: { data: number }) => void;
    onError?: (event: { data: number }) => void;
  };
}

interface YTNamespace {
  Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const PLAYING = 1;

let apiPromise: Promise<YTNamespace> | null = null;

/** Nạp script IFrame API 1 lần cho cả phiên; các trình phát sau dùng lại */
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      script.remove();
      reject(new Error("Không tải được trình phát YouTube."));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export type YouTubePlayerStatus = "loading" | "ready" | "error";

interface UseYouTubePlayerOptions {
  videoId: string;
  /** Chỉ phát 1 đoạn của video: giây bắt đầu / kết thúc */
  startSec?: number | null;
  endSec?: number | null;
  /**
   * Gọi ở mỗi khung hình khi đang phát (và ngay sau khi tua / dừng) với thời điểm hiện tại.
   * Dùng cho việc cần chính xác như dừng đúng cuối câu; state `time` chỉ cập nhật ~8 lần/giây.
   */
  onTick?: (time: number, isPlaying: boolean) => void;
}

/** Số lần cập nhật state `time` mỗi giây: đủ mượt cho phụ đề mà không render lại liên tục */
const TIME_STATE_INTERVAL_MS = 125;

/**
 * Trình phát YouTube (nhúng, đúng điều khoản: dùng nguyên trình phát của YouTube, không che hay sửa nó)
 * kèm các lệnh điều khiển cho phụ đề: phát, dừng, tua tới giây bất kỳ, đổi tốc độ.
 * Gắn `containerRef` vào 1 thẻ div rỗng: iframe được tạo bên trong thẻ đó.
 */
export function useYouTubePlayer({ videoId, startSec, endSec, onTick }: UseYouTubePlayerOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [status, setStatus] = useState<YouTubePlayerStatus>("loading");
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [time, setTime] = useState(startSec ?? 0);

  const onTickRef = useRef(onTick);
  useEffect(() => {
    onTickRef.current = onTick;
  });

  const lastTimeUpdateRef = useRef(0);
  const report = useCallback((current: number, force = false) => {
    onTickRef.current?.(current, isPlayingRef.current);
    const now = performance.now();
    if (force || now - lastTimeUpdateRef.current >= TIME_STATE_INTERVAL_MS) {
      lastTimeUpdateRef.current = now;
      setTime(current);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let frame = 0;
    // YouTube thay thẻ này bằng iframe: tạo riêng để React không phải quản lý phần tử bị thay
    const mount = document.createElement("div");
    container.appendChild(mount);
    setStatus("loading");
    setErrorCode(null);
    setIsPlaying(false);
    isPlayingRef.current = false;

    const tick = () => {
      const player = playerRef.current;
      if (player) report(player.getCurrentTime());
      frame = requestAnimationFrame(tick);
    };

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(mount, {
          // Bản không cookie của YouTube: không lưu cookie theo dõi khi người học chưa bấm phát
          host: "https://www.youtube-nocookie.com",
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            start: startSec ?? undefined,
            end: endSec ?? undefined,
            playsinline: 1,
            rel: 0,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (!cancelled) setStatus("ready");
            },
            onStateChange: ({ data }) => {
              if (cancelled) return;
              const playing = data === PLAYING;
              isPlayingRef.current = playing;
              setIsPlaying(playing);
              cancelAnimationFrame(frame);
              if (playing) frame = requestAnimationFrame(tick);
              else if (playerRef.current) report(playerRef.current.getCurrentTime(), true);
            },
            onError: ({ data }) => {
              if (cancelled) return;
              setErrorCode(data);
              setStatus("error");
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      playerRef.current?.destroy();
      playerRef.current = null;
      mount.remove();
    };
  }, [videoId, startSec, endSec, report]);

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);

  const seek = useCallback(
    (seconds: number) => {
      const player = playerRef.current;
      if (!player) return;
      const target = Math.max(startSec ?? 0, endSec ? Math.min(seconds, endSec) : seconds);
      player.seekTo(target, true);
      report(target, true);
    },
    [startSec, endSec, report],
  );

  const setPlaybackRate = useCallback((rate: number) => playerRef.current?.setPlaybackRate(rate), []);

  /** Thời điểm chính xác lúc gọi (state `time` có thể chậm tới ~0,1 giây) */
  const getTime = useCallback(() => playerRef.current?.getCurrentTime() ?? 0, []);

  return { containerRef, status, errorCode, isPlaying, time, play, pause, seek, setPlaybackRate, getTime };
}

/** Thông báo lỗi dễ hiểu theo mã lỗi của YouTube */
export function youTubeErrorMessage(code: number | null): string {
  if (code === 101 || code === 150) return "Chủ video không cho phát video này ngoài YouTube, hoặc video bị chặn ở khu vực của bạn.";
  if (code === 100) return "Video đã bị gỡ hoặc chuyển sang riêng tư.";
  return "Không tải được trình phát YouTube. Kiểm tra mạng rồi tải lại trang.";
}
