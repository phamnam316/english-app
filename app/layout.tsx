import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Newsreader, Noto_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { getAuthSession } from "@/lib/auth";
import { APP_NAME } from "@/lib/ui-constants";

import "./globals.css";

/*
 * Cả 3 font đều có đủ dấu tiếng Việt. Chỉ nạp đúng những gì giao diện dùng để trang nhẹ (font là phần nặng nhất):
 * - Be Vietnam Pro: chữ giao diện, 3 độ đậm 400/500/600 (không dùng 700).
 * - Newsreader: tiêu đề, từ vựng, câu ví dụ. Bản variable chỉ có trục độ đậm, không nạp trục optical size
 *   và bộ chữ nghiêng (2 thứ này làm file font nặng gấp ~3 lần).
 * - Noto Sans: phiên âm IPA (ɪ ə ʊ θ ð ŋ ʃ ʒ ˈ ː nằm ở bảng latin-ext và greek). Không preload: trình duyệt
 *   chỉ tải khi trang thật sự có phiên âm.
 */
const ui = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-ui",
  display: "swap",
});

const display = Newsreader({
  subsets: ["latin", "vietnamese"],
  style: "normal",
  variable: "--font-display",
  display: "swap",
});

const phonetic = Noto_Sans({
  subsets: ["latin", "latin-ext", "greek"],
  weight: "400",
  variable: "--font-phonetic",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: "Học từ vựng, ngữ pháp và luyện nói tiếng Anh mỗi ngày.",
};

export const viewport: Viewport = {
  // Cho phép nội dung tràn tới mép màn hình tai thỏ; thanh nút đáy tự chừa vùng an toàn
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ec" },
    { media: "(prefers-color-scheme: dark)", color: "#171915" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Đọc session ở server để truyền xuống SessionProvider: header hiện XP/streak ngay, không nháy
  const session = await getAuthSession();

  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${ui.variable} ${display.variable} ${phonetic.variable} font-sans antialiased`}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
