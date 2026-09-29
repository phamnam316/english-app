/**
 * Âm thanh phản hồi tạo trực tiếp bằng Web Audio API: không cần file .mp3,
 * không tốn băng thông, phát ngay lập tức.
 */

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!AudioContextCtor) return null;

  audioContext ??= new AudioContextCtor();
  // Trình duyệt tạm dừng AudioContext cho tới khi user tương tác; hàm này luôn được gọi sau 1 cú click
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

interface Tone {
  frequency: number;
  /** Giây, tính từ lúc bắt đầu phát */
  start: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
}

function playTones(tones: Tone[]): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    for (const { frequency, start, duration, type = "sine", volume = 0.18 } of tones) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const startAt = ctx.currentTime + start;

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      // Tăng/giảm âm lượng thật nhanh để không bị tiếng "lụp bụp" ở đầu/cuối
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.05);
    }
  } catch {
    // Âm thanh chỉ là phần phụ: lỗi phát âm thanh không được làm hỏng luồng làm bài
  }
}

/** "Ting!": hai nốt cao đi lên */
export function playCorrectSound(): void {
  playTones([
    { frequency: 1318.5, start: 0, duration: 0.14 },
    { frequency: 1760, start: 0.09, duration: 0.4 },
  ]);
}

/** "Bip!": hai nốt trầm đi xuống */
export function playWrongSound(): void {
  playTones([
    { frequency: 233, start: 0, duration: 0.16, type: "square", volume: 0.06 },
    { frequency: 175, start: 0.15, duration: 0.28, type: "square", volume: 0.06 },
  ]);
}
