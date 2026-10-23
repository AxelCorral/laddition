import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Polices lues à l'exécution par les images de partage.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./assets/og/**"],
    "/r/[numero]/[grille]/opengraph-image": ["./assets/og/**"],
  },
};

export default nextConfig;
