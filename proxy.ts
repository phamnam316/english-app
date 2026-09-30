import { withAuth } from "next-auth/middleware";

/**
 * Bảo vệ các trang riêng tư. Chưa đăng nhập -> chuyển hướng về /login?callbackUrl=<trang đang mở>
 * để sau khi đăng nhập quay lại đúng trang.
 *
 * Next.js 16: file này tên là proxy.ts (middleware.ts đã deprecated).
 * Next.js 15 trở về trước: đổi tên file thành middleware.ts, nội dung giữ nguyên.
 *
 * Proxy chỉ đọc cookie JWT (không truy vấn DB) nên rất nhẹ. Các API trong /api/*
 * KHÔNG đi qua đây: chúng tự kiểm tra đăng nhập và trả 401 dạng JSON.
 */
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/courses/:path*",
    "/lessons/:path*",
    "/practice/:path*",
    "/leaderboard/:path*",
    "/ai-chat/:path*",
  ],
};
