import type { NextConfig } from "next";

// Where the Node.js API runs. The browser uses NEXT_PUBLIC_API_URL, server components use API_URL.
const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4000";
const api = new URL(apiUrl);
// The admin panel embeds /embed/3d to preview 3D models, so only it may frame that page
const adminOrigin = new URL(process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002").origin;

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
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: [
          { key: "Content-Security-Policy", value: `frame-ancestors 'self' ${adminOrigin}` },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
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
