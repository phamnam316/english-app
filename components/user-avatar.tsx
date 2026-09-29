import { getAvatarInitial } from "@/lib/user-display";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  if (user.image) {
    return (
      // Ảnh từ Google/OAuth ở domain bất kỳ -> dùng <img> thay vì next/image (không phải khai báo remotePatterns)
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt=""
        referrerPolicy="no-referrer"
        className={cn("size-9 shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-tile-pink font-heading text-sm font-bold text-tile-foreground",
        className,
      )}
    >
      {getAvatarInitial(user)}
    </span>
  );
}
