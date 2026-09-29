import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bcryptjs và Prisma chỉ chạy trên server
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
