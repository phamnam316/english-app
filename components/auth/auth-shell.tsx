import { LogoMark } from "@/components/logo-mark";
import { APP_NAME } from "@/lib/ui-constants";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/**
 * Khung trang đăng nhập / đăng ký: máy tính có cột giới thiệu bên trái (một mục từ mẫu như trong bài học),
 * form nằm trong thẻ bên phải. Điện thoại chỉ có logo và form.
 */
export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh max-w-[1180px] gap-8 px-4 pt-8 pb-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:gap-20">
        <section aria-label={`Giới thiệu ${APP_NAME}`} className="hidden lg:block">
          <Brand />
          <p className="mt-12 max-w-lg font-serif text-[3.25rem] leading-[1.05] tracking-[-0.015em]">
            Học tiếng Anh mỗi ngày, một bài ngắn.
          </p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Từ vựng A1–A2 có phát âm, câu ví dụ có bản dịch, ghi chú ngữ pháp và trò chơi ôn tập.
          </p>

          <figure className="mt-10 max-w-lg rounded-lg border border-line bg-card px-8 py-7">
            <figcaption className="text-[13px] font-medium text-muted-foreground">Từ của hôm nay</figcaption>
            <p className="mt-2 font-serif text-[3.25rem] leading-none tracking-[-0.015em]">welcome</p>
            <p className="mt-2 font-ipa text-lg text-muted-foreground">
              /ˈwelkəm/ <span className="font-sans text-[13px]">· A1</span>
            </p>
            <div className="mt-5 border-t-2 border-foreground pt-4">
              <p className="text-xl font-semibold">chào mừng; hoan nghênh</p>
              <p className="mt-3 font-serif text-xl">
                <span className="word-mark font-semibold">Welcome</span> to our school!
              </p>
              <p className="mt-1 text-[14px] text-muted-foreground">Chào mừng bạn đến với trường của chúng tôi!</p>
            </div>
          </figure>

          <dl className="mt-8 grid max-w-lg grid-cols-3 divide-x divide-line border-y border-line py-4">
            {[
              ["2.307", "từ A1–A2"],
              ["30", "ngày giáo án"],
              ["5", "trò ôn tập"],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col-reverse px-4 first:pl-0">
                <dt className="text-[13px] text-muted-foreground">{label}</dt>
                <dd className="font-serif text-[2rem] leading-tight">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mx-auto w-full max-w-[440px]">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="mt-8 rounded-lg border border-line bg-card p-6 sm:p-9 lg:mt-0">
            <h1 className="text-[2.25rem] leading-[1.1] tracking-[-0.01em]">{title}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <p className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-[15px] font-semibold">{APP_NAME}</span>
    </p>
  );
}
