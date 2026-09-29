import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { getAuthSession } from "@/lib/auth";
import { APP_NAME } from "@/lib/ui-constants";

import "./globals.css";

/*
 * Thiết kế gốc dùng Urbanist (tiêu đề) + Inter (nội dung). Urbanist không có bộ ký tự tiếng Việt
 * (các chữ như "ạ", "ố" sẽ rơi sang font khác), nên tiêu đề dùng Plus Jakarta Sans: cùng dáng
 * hình học, có đủ dấu tiếng Việt.
 */
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: "Học từ vựng, ngữ pháp và luyện nói tiếng Anh mỗi ngày.",
};

export const viewport: Viewport = {
  // Cho phép nội dung tràn tới mép màn hình tai thỏ; thanh nút đáy tự chừa vùng an toàn
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0a1d" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Đọc session ở server để truyền xuống SessionProvider: header hiện XP/streak ngay, không nháy
  const session = await getAuthSession();

  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
