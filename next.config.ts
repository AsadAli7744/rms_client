import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only. A bare "*" is rejected, so these patterns allow every IPv4
  // address and every hostname with two or more labels (HMR, /_next, etc.).
  allowedDevOrigins: ["*.*.*.*", "*.*.*", "*.*"],
};

export default nextConfig;
