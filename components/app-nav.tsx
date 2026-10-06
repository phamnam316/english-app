"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Gamepad2, House, Trophy, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Các đường dẫn khác cũng tính là đang ở mục này */
  also?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Trang chủ", icon: House, also: ["/courses"] },
  { href: "/practice", label: "Luyện tập", icon: Gamepad2 },
  { href: "/videos", label: "Xem phim", icon: Clapperboard },
  { href: "/leaderboard", label: "Xếp hạng", icon: Trophy },
];

function useIsActive() {
  const pathname = usePathname();
  return (item: NavItem) =>
    [item.href, ...(item.also ?? [])].some((href) => pathname === href || pathname.startsWith(`${href}/`));
}

/** Máy tính / máy tính bảng: các mục điều hướng nằm trong header, mục đang chọn gạch chân màu đất nung */
export function DesktopNav() {
  const isActive = useIsActive();

  return (
    <nav aria-label="Điều hướng chính" className="hidden h-full items-stretch gap-7 md:flex">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center text-[15px] outline-none transition-colors focus-visible:text-foreground focus-visible:underline",
              active
                ? "font-semibold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-clay"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Điện thoại: thanh điều hướng cố định ở đáy, trong tầm ngón cái */
export function MobileNav() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] outline-none focus-visible:bg-panel",
                  active
                    ? "font-semibold text-foreground before:absolute before:inset-x-6 before:top-0 before:h-0.5 before:bg-clay"
                    : "text-muted-foreground",
                )}
              >
                <Icon aria-hidden className={cn("size-5", active && "text-moss")} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
