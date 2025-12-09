import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
    // Allow unoptimized images for our proxy API
    unoptimized: false,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  serverExternalPackages: ["nodemailer"],
};

export default nextConfig;
