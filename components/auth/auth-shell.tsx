import { LogoMark } from "@/components/logo-mark";
import { APP_NAME } from "@/lib/ui-constants";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/**
 * Khung trang đăng nhập / đăng ký theo màn "Category" của thiết kế: header tím với tiêu đề lớn,
 * nội dung nằm trên tấm nền trắng bo góc. Điện thoại: tấm nền kéo tới đáy màn hình.
 * Máy tính: header và tấm nền xếp giữa trang.
 */
export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-hero-purple sm:items-center sm:justify-center sm:px-4 sm:py-10">
      {/* Vòng tròn trang trí trên nền tím */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-20 size-72 rounded-full bg-white/10" />
        <div className="absolute top-40 -left-16 size-40 rounded-full bg-white/5" />
        <div className="absolute right-[12%] bottom-[-8rem] hidden size-96 rounded-full bg-white/5 sm:block" />
      </div>

      <div className="relative w-full px-6 pt-10 pb-10 text-white sm:max-w-md sm:px-0 sm:pt-0 sm:pb-8">
        <div className="flex items-center gap-2.5">
          <LogoMark inverted className="size-10" />
          <span className="font-heading text-xl font-semibold">{APP_NAME}</span>
        </div>
        <h1 className="mt-10 text-[2rem] leading-tight font-medium sm:mt-8">{title}</h1>
        <p className="mt-1.5 text-white/80">{subtitle}</p>
      </div>

      <div className="relative flex-1 rounded-t-[2rem] bg-card px-6 pt-8 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:w-full sm:max-w-md sm:flex-none sm:rounded-[2rem] sm:p-8 sm:shadow-2xl">
        {children}
      </div>
    </div>
  );
}
