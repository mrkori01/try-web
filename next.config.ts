import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.e2b.app"],
  async redirects() {
    return [{ source: "/download", destination: "/access", permanent: false }];
  },
};

export default nextConfig;
