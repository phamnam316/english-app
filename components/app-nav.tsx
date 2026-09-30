"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, House, Trophy, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Trang chủ", icon: House },
  { href: "/practice", label: "Luyện tập", icon: Gamepad2 },
  { href: "/leaderboard", label: "Xếp hạng", icon: Trophy },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Máy tính / máy tính bảng: các nút điều hướng nằm trong header */
export function DesktopNav() {
  const isActive = useIsActive();

  return (
    <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 rounded-full bg-surface-soft p-1 md:flex">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-4" />
            {label}
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
      className="fixed inset-x-0 bottom-0 z-30 rounded-t-3xl border-t border-border/70 bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-18px_rgb(38_31_90/0.35)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-full transition-colors",
                    active && "bg-secondary",
                  )}
                >
                  <Icon aria-hidden className="size-5" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
