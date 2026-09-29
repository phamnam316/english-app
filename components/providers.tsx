"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";

/**
 * Provider dùng chung cho toàn app:
 * - SessionProvider nhận session từ server -> không bị "nháy" trạng thái chưa đăng nhập.
 * - ThemeProvider: tự theo chế độ sáng/tối của hệ điều hành.
 * - Toaster (sonner) đặt ở trên cùng để không che thanh nút cố định ở đáy màn hình học.
 */
export function Providers({ session, children }: { session: Session | null; children: React.ReactNode }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </ThemeProvider>
    </SessionProvider>
  );
}
