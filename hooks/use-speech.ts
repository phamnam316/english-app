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

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    audioRef.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
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

  const isLoading = useCallback(
    (text: string, { speed = 1, voice = "alloy" }: SpeakOptions = {}) => loadingKey === `${voice}|${speed}|${text}`,
    [loadingKey],
  );

  return { speak, stop, isLoading };
}
