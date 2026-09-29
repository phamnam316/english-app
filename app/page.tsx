import { redirect } from "next/navigation";

/** Trang gốc: đưa thẳng vào Dashboard (proxy.ts sẽ chuyển về /login nếu chưa đăng nhập).
 *  Khi có landing page giới thiệu sản phẩm, thay nội dung file này. */
export default function HomePage() {
  redirect("/dashboard");
}
