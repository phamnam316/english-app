import { cn } from "@/lib/utils";

/**
 * Khối trang trí cho nền navy/tím, gợi lại cảnh 3D (quả cầu, cột, vòng) của thiết kế gốc
 * nhưng dựng hoàn toàn bằng CSS: không tốn ảnh, tự co giãn theo khung chứa.
 * Đặt trong khung `relative overflow-hidden`; nội dung phía trên cần `relative`.
 */
export function HeroDecor({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {/* Quầng sáng tím phía sau */}
      <div className="absolute -top-16 right-[-10%] size-72 rounded-full bg-[#6e58fc]/35 blur-3xl" />
      {/* Cột xanh */}
      <div className="absolute top-[-10%] right-[34%] h-[70%] w-7 rounded-b-full bg-linear-to-b from-[#a6dcae]/70 to-[#6fae7a]/40" />
      {/* Quả cầu lớn */}
      <div className="absolute top-[12%] right-[8%] size-28 rounded-full bg-[radial-gradient(circle_at_32%_28%,#a697ff_0%,#5b45e0_45%,#2b2170_100%)] shadow-[0_20px_40px_-10px_rgb(0_0_0/0.5)] sm:size-36" />
      {/* Vòng vàng */}
      <div className="absolute top-[42%] right-[2%] h-8 w-20 -rotate-12 rounded-[50%] border-[5px] border-[#f5b94a]/80 sm:w-24" />
      {/* Quả cầu nhỏ, lấp một nửa ở mép phải */}
      <div className="absolute top-[58%] right-[-5%] size-16 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff_0%,#d9d3ff_35%,#6e58fc_100%)] opacity-70" />
      {/* Lớp tối dần về phía chữ (bên trái và phía dưới) để chữ trắng luôn dễ đọc */}
      <div className="absolute inset-0 bg-linear-to-r from-navy-deep/80 via-navy-deep/20 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-navy-deep/95 via-navy-deep/25 to-transparent" />
    </div>
  );
}
