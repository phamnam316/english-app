"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Flame, LoaderCircle, LogOut } from "lucide-react";
import type { Session } from "next-auth";

import { DesktopNav, MobileNav } from "@/components/app-nav";
import { LogoMark } from "@/components/logo-mark";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getLevelInfo, type LevelInfo } from "@/lib/gamification";
import { APP_NAME } from "@/lib/ui-constants";
import { cn } from "@/lib/utils";

/**
 * Thanh đầu các trang chính: logo, điều hướng (máy tính), chuỗi ngày học + XP và avatar (mở menu tài khoản).
 * Điện thoại có thêm thanh điều hướng ở đáy: trang dùng header này cần chừa pb-28 md:pb-16.
 */
export function AppHeader() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <>
      <header className="border-b border-line bg-background">
        <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-4 px-4 sm:gap-8 sm:px-8">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2.5 rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <LogoMark />
            <span className="hidden text-[15px] font-semibold min-[420px]:inline">{APP_NAME}</span>
          </Link>

          <DesktopNav />

          <div className="ml-auto">
            {status === "loading" || !user ? <Skeleton className="h-9 w-40" /> : <UserStats user={user} />}
          </div>
        </div>
      </header>
      <MobileNav />
    </>
  );
}

function UserStats({ user }: { user: Session["user"] }) {
  const level = getLevelInfo(user.xp);

  return (
    <div className="flex items-center gap-3.5 text-[15px] sm:gap-5">
      <span className="inline-flex items-center gap-1.5 tabular-nums" title={`Chuỗi ${user.streak} ngày học liên tiếp`}>
        <Flame aria-hidden className={cn("size-[18px]", user.streak > 0 ? "text-clay" : "text-muted-foreground")} />
        <span className="font-semibold">{user.streak}</span>
        <span className="text-muted-foreground">ngày</span>
        <span className="sr-only">học liên tiếp</span>
      </span>
      <span className="inline-flex items-baseline gap-1 tabular-nums" title={`${user.xp} XP: điểm siêng năng, cộng khi học xong bài và ôn bài`}>
        <span className="font-semibold">{user.xp}</span>
        <span className="text-muted-foreground">XP</span>
      </span>
      <UserMenu user={user} level={level} />
    </div>
  );
}

function UserMenu({ user, level }: { user: Session["user"]; level: LevelInfo }) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Tài khoản của bạn"
          className="rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <UserAvatar user={user} />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <UserAvatar user={user} className="size-16 text-xl" />
          <DialogTitle className="font-serif text-2xl font-medium">{user.name ?? "Học viên"}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 border-y border-line py-3 text-center">
          <div>
            <dt className="text-xs text-muted-foreground">Chuỗi ngày học</dt>
            <dd className="text-xl font-semibold tabular-nums">{user.streak}</dd>
          </div>
          <div className="border-l border-line">
            <dt className="text-xs text-muted-foreground">Tổng XP</dt>
            <dd className="text-xl font-semibold tabular-nums">{user.xp}</dd>
          </div>
        </dl>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold text-moss-strong">Cấp {level.level}</span>
            <span className="text-muted-foreground">
              Còn {level.xpToNextLevel} XP để lên cấp {level.level + 1}
            </span>
          </div>
          <Progress value={level.percent} aria-label="Tiến độ lên cấp" />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled={isSigningOut}
            onClick={() => {
              setIsSigningOut(true);
              void signOut({ callbackUrl: "/login" });
            }}
          >
            {isSigningOut ? <LoaderCircle className="animate-spin" /> : <LogOut />}
            Đăng xuất
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
