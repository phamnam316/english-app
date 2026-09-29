import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";

/**
 * Layout chung cho các trang cần đăng nhập (Dashboard, Khóa học, Bài học).
 * proxy.ts đã chặn ở tầng mạng; kiểm tra lại ở đây để trang không bao giờ render khi thiếu session
 * (ví dụ thêm route mới mà quên khai báo trong matcher của proxy).
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect("/login");

  return <div className="min-h-dvh bg-background">{children}</div>;
}
