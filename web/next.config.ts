import type { NextConfig } from "next";

// Where the Node.js API runs. The browser uses NEXT_PUBLIC_API_URL, server components use API_URL.
const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4000";
const api = new URL(apiUrl);

const nextConfig: NextConfig = {
  // The storefront is driven by admin-editable content, so pages render dynamically
  // (no static caching). Each fetch declares its own caching in src/lib/api.ts.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      // Uploaded media served by the API (/uploads/...)
      { protocol: api.protocol.replace(":", "") as "http" | "https", hostname: api.hostname, port: api.port || "" },
      // Any https image url entered in the admin (Unsplash demo content, CDNs ...)
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
