import Link from "next/link";

import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/ui-constants";

/** Trang 404: trình bày như một mục từ trong từ điển, kèm đường về trang chủ */
export default function NotFound() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-[720px] px-4 pt-8 pb-16 sm:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[15px] font-semibold">{APP_NAME}</span>
        </Link>

        <article className="mt-16 sm:mt-24">
          <p className="text-[14px] text-muted-foreground">Lỗi 404</p>
          <h1 className="mt-3 text-[3.25rem] leading-none tracking-[-0.015em] sm:text-[4.5rem]">lost</h1>
          <p className="mt-3 font-ipa text-xl text-muted-foreground">
            /lɒst/ <span className="font-sans text-[14px]">· A2</span>
          </p>
          <dl className="mt-10 border-t-2 border-foreground">
            <div className="grid gap-2 border-b border-line py-6 sm:grid-cols-[120px_1fr] sm:gap-6">
              <dt className="text-[14px] font-medium text-muted-foreground sm:pt-2">Nghĩa</dt>
              <dd className="text-[1.75rem] leading-tight font-semibold">bị lạc</dd>
            </div>
            <div className="grid gap-2 border-b border-line py-6 sm:grid-cols-[120px_1fr] sm:gap-6">
              <dt className="text-[14px] font-medium text-muted-foreground sm:pt-1">Ví dụ</dt>
              <dd>
                <p className="font-serif text-[1.5rem] leading-snug">
                  I think we&apos;re <span className="word-mark font-semibold">lost</span>.
                </p>
                <p className="mt-1.5 text-[15px] text-muted-foreground">
                  Trang bạn tìm không tồn tại hoặc đã được chuyển đi.
                </p>
              </dd>
            </div>
          </dl>
          <Button asChild size="lg" className="mt-8">
            <Link href="/dashboard">Về trang chủ</Link>
          </Button>
        </article>
      </div>
    </main>
  );
}
