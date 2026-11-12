import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prévient les collisions de création de dossiers concurrentes sur Windows
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
