"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { api, isAbortError, toApiClientError } from "@/lib/api-client";

export interface SpeakOptions {
  /** 1 = bình thường, 0.75 = chậm cho người mới */
  speed?: number;
  voice?: "alloy" | "echo";
  /** File phát âm có sẵn (vd Vocabulary.audioUrl): phát trực tiếp, không gọi TTS */
  audioUrl?: string | null;
}

/**
 * Cache file mp3 đã tạo trong suốt phiên làm việc: bấm nghe lại cùng 1 từ
 * không gọi lại API TTS (đỡ độ trễ và đỡ tốn tiền).
 */
const audioUrlCache = new Map<string, string>();

/**
 * Server trả 503 = chưa cấu hình TTS (thiếu OPENAI_API_KEY): nhớ lại trong phiên để các lần sau
 * dùng thẳng giọng đọc của trình duyệt, không phải chờ gọi API thất bại ở mỗi lần bấm nghe.
 */
let serverTtsUnavailable = false;

function speakWithBrowserVoice(text: string, speed: number): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = speed;
  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Phát âm tiếng Anh: ưu tiên file audio có sẵn -> API TTS (OpenAI) -> giọng đọc của trình duyệt.
 * Bước cuối giúp nút nghe vẫn hoạt động khi server chưa cấu hình OPENAI_API_KEY hoặc hết quota.
 */
export function useSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  // Mỗi lần dừng/phát mới tăng số này: chuỗi "nghe cả đoạn" đang chạy thấy số đổi thì tự dừng
  const sequenceRef = useRef(0);
  // Câu đang phát trong chuỗi: dừng giữa chừng thì báo xong ngay
  const finishLineRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    sequenceRef.current++;
    controllerRef.current?.abort();
    audioRef.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    finishLineRef.current?.();
  }, []);

  // Rời trang / đổi thẻ: dừng âm thanh đang phát
  useEffect(() => stop, [stop]);

  const speak = useCallback(
    async (text: string, { speed = 1, voice = "alloy", audioUrl }: SpeakOptions = {}) => {
      const key = `${voice}|${speed}|${text}`;
      stop();

      try {
        let url = audioUrl ?? audioUrlCache.get(key);
        if (!url && serverTtsUnavailable) {
          if (!speakWithBrowserVoice(text, speed)) toast.error("Không phát được âm thanh. Vui lòng thử lại.");
          return;
        }
        if (!url) {
          const controller = new AbortController();
          controllerRef.current = controller;
          setLoadingKey(key);
          const blob = await api.textToSpeech({ text, voice, speed }, controller.signal);
          url = URL.createObjectURL(blob);
          audioUrlCache.set(key, url);
        }

        audioRef.current ??= new Audio();
        audioRef.current.src = url;
        // File có sẵn không có bản đọc chậm -> giảm tốc độ phát
        audioRef.current.playbackRate = audioUrl ? speed : 1;
        await audioRef.current.play();
      } catch (error) {
        if (isAbortError(error)) return;
        if (toApiClientError(error).status === 503) serverTtsUnavailable = true;
        if (!speakWithBrowserVoice(text, speed)) {
          toast.error("Không phát được âm thanh. Vui lòng thử lại.");
        }
      } finally {
        setLoadingKey((current) => (current === key ? null : current));
      }
    },
    [stop],
  );

  /** Phát 1 câu (dùng trong chuỗi) và chờ đến khi phát xong hoặc bị dừng */
  const playUntilEnd = useCallback(async (text: string, speed: number, token: number) => {
    const key = `alloy|${speed}|${text}`;
    let url = audioUrlCache.get(key);
    if (!url && !serverTtsUnavailable) {
      try {
        const controller = new AbortController();
        controllerRef.current = controller;
        setLoadingKey(key);
        const blob = await api.textToSpeech({ text, voice: "alloy", speed }, controller.signal);
        url = URL.createObjectURL(blob);
        audioUrlCache.set(key, url);
      } catch (error) {
        if (isAbortError(error)) return;
        if (toApiClientError(error).status === 503) serverTtsUnavailable = true;
      } finally {
        setLoadingKey((current) => (current === key ? null : current));
      }
    }
    if (token !== sequenceRef.current) return;

    await new Promise<void>((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        finishLineRef.current = null;
        resolve();
      };
      finishLineRef.current = finish;

      if (url) {
        const audio = (audioRef.current ??= new Audio());
        audio.src = url;
        audio.playbackRate = 1;
        audio.onended = finish;
        audio.play().catch(finish);
        return;
      }
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        finish();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = speed;
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  /**
   * Đọc lần lượt nhiều câu (vd cả đoạn hội thoại), nghỉ ngắn giữa các câu.
   * `onLine(i)` báo câu đang đọc; đọc hết gọi `onLine(-1)`. Gọi speak/stop sẽ dừng chuỗi.
   */
  const speakAll = useCallback(
    async (texts: string[], { speed = 1, onLine }: { speed?: number; onLine?: (index: number) => void } = {}) => {
      stop();
      const token = sequenceRef.current;
      for (let i = 0; i < texts.length; i++) {
        if (token !== sequenceRef.current) return;
        onLine?.(i);
        await playUntilEnd(texts[i], speed, token);
        if (token !== sequenceRef.current) return;
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      if (token === sequenceRef.current) onLine?.(-1);
    },
    [playUntilEnd, stop],
  );

  const isLoading = useCallback(
    (text: string, { speed = 1, voice = "alloy" }: SpeakOptions = {}) => loadingKey === `${voice}|${speed}|${text}`,
    [loadingKey],
  );

  return { speak, speakAll, stop, isLoading };
}
