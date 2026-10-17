import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // exceljs uses Node built-ins; keep it out of the server bundle and load it
  // natively (it is only reached from the admin export route handlers).
  serverExternalPackages: ["exceljs"],
  async headers() {
    return [
      {
        // Admin pages read a session cookie; never allow a shared cache to
        // store them. The edge guard in `src/proxy.ts` also sets this.
        source: "/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
