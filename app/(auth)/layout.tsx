import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";

/** Layout cho trang đăng nhập / đăng ký. Đã đăng nhập thì vào thẳng Dashboard. Giao diện nằm ở AuthShell */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (session?.user?.id) redirect("/dashboard");

  return <main>{children}</main>;
}
