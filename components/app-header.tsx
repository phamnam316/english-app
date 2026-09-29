"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Flame, LoaderCircle, LogOut, Star } from "lucide-react";
import type { Session } from "next-auth";

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
import { getGreetingName } from "@/lib/user-display";
import { cn } from "@/lib/utils";

/**
 * Đầu trang chủ theo thiết kế: lời chào + tên bên trái, streak/XP và avatar (mở menu tài khoản) bên phải.
 */
export function AppHeader() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="mx-auto flex w-full max-w-5xl items-center gap-3 px-5 pt-8 sm:px-6 sm:pt-10">
      {status === "loading" || !user ? (
        <>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="size-11 rounded-full" />
        </>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              Xin chào <span aria-hidden>👋</span>
            </p>
            <p className="truncate font-heading text-lg font-semibold">{user.name?.trim() || getGreetingName(user)}</p>
          </div>
          <UserStats user={user} />
        </>
      )}
    </header>
  );
}

function StatChip({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-full bg-surface-soft px-2.5 text-sm font-semibold tabular-nums sm:h-9 sm:gap-1.5 sm:px-3",
        className,
      )}
    >
      <span className="sr-only">{title}</span>
      {children}
    </span>
  );
}

function UserStats({ user }: { user: Session["user"] }) {
  const level = getLevelInfo(user.xp);

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      <StatChip title={`Chuỗi ${user.streak} ngày học liên tiếp`}>
        <Flame
          aria-hidden
          className={cn("size-4", user.streak > 0 ? "fill-streak text-streak" : "text-muted-foreground")}
        />
        <span aria-hidden>{user.streak}</span>
      </StatChip>

      <StatChip title={`${user.xp} điểm kinh nghiệm`}>
        <Star aria-hidden className="size-4 fill-xp text-xp" />
        <span aria-hidden>{user.xp}</span>
        <span aria-hidden className="hidden font-medium text-muted-foreground sm:inline">
          XP
        </span>
      </StatChip>

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
          className="ml-1 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <UserAvatar user={user} className="size-10 ring-2 ring-lavender sm:size-11" />
        </button>
      </DialogTrigger>

      <DialogContent className="rounded-3xl sm:max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <UserAvatar user={user} className="size-16 text-2xl ring-4 ring-lavender" />
          <DialogTitle className="text-xl font-semibold">{user.name ?? "Học viên"}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 rounded-2xl bg-surface-soft p-4">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold text-primary">Cấp {level.level}</span>
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
