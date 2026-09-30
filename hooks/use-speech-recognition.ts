"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/*
 * Kiểu tối giản của Web Speech API (SpeechRecognition): chưa có sẵn trong lib.dom của TypeScript.
 * Chrome/Edge/Safari hỗ trợ (tên webkitSpeechRecognition), Firefox chưa hỗ trợ.
 */
interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<RecognitionAlternative>>;
}
interface RecognitionErrorEvent {
  error: string;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => Recognition;

function getRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type RecognitionErrorCode = "unsupported" | "not-allowed" | "no-speech" | "audio-capture" | "network" | "aborted" | "unknown";

export class SpeechRecognitionError extends Error {
  constructor(public readonly code: RecognitionErrorCode) {
    super(code);
    this.name = "SpeechRecognitionError";
  }
}

export const RECOGNITION_ERROR_MESSAGES: Record<RecognitionErrorCode, string> = {
  unsupported: "Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge.",
  "not-allowed": "Bạn chưa cho phép dùng micro. Bấm biểu tượng ổ khóa cạnh thanh địa chỉ để bật micro.",
  "no-speech": "Mình chưa nghe thấy gì. Bấm micro rồi đọc to, rõ hơn nhé.",
  "audio-capture": "Không tìm thấy micro trên thiết bị của bạn.",
  network: "Nhận dạng giọng nói cần kết nối mạng. Kiểm tra mạng rồi thử lại.",
  aborted: "",
  unknown: "Không nhận dạng được giọng nói. Thử lại nhé.",
};

function toErrorCode(error: string): RecognitionErrorCode {
  if (error === "not-allowed" || error === "service-not-allowed") return "not-allowed";
  if (error === "no-speech" || error === "audio-capture" || error === "network" || error === "aborted") return error;
  return "unknown";
}

const noopSubscribe = () => () => {};

/**
 * Nhận dạng giọng nói tiếng Anh. `listen()` trả về các cách nhận dạng (tốt nhất trước);
 * mảng rỗng nếu người dùng không nói gì. Lỗi được ném dạng SpeechRecognitionError.
 */
export function useSpeechRecognition(lang = "en-US") {
  // Server luôn trả false; trình duyệt trả kết quả thật sau khi hydrate (không lệch HTML)
  const isSupported = useSyncExternalStore(
    noopSubscribe,
    () => getRecognitionConstructor() !== null,
    () => false,
  );
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);

  // Rời trang: tắt micro
  useEffect(() => () => recognitionRef.current?.abort(), []);

  const listen = useCallback(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const Constructor = getRecognitionConstructor();
        if (!Constructor) {
          reject(new SpeechRecognitionError("unsupported"));
          return;
        }

        recognitionRef.current?.abort();
        const recognition = new Constructor();
        recognition.lang = lang;
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.maxAlternatives = 5;

        let settled = false;
        recognition.onresult = (event) => {
          const transcripts: string[] = [];
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            for (let j = 0; j < result.length; j++) transcripts.push(result[j].transcript);
          }
          settled = true;
          resolve(transcripts);
        };
        recognition.onerror = (event) => {
          if (settled) return;
          settled = true;
          reject(new SpeechRecognitionError(toErrorCode(event.error)));
        };
        recognition.onend = () => {
          if (recognitionRef.current === recognition) recognitionRef.current = null;
          setIsListening(false);
          if (!settled) {
            settled = true;
            resolve([]);
          }
        };

        recognitionRef.current = recognition;
        setIsListening(true);
        try {
          recognition.start();
        } catch {
          recognitionRef.current = null;
          setIsListening(false);
          settled = true;
          reject(new SpeechRecognitionError("unknown"));
        }
      }),
    [lang],
  );

  /** Dừng nghe sớm: phần đã nói vẫn được nhận dạng */
  const stop = useCallback(() => recognitionRef.current?.stop(), []);

  return { isSupported, isListening, listen, stop };
}
