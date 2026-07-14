import type { NextConfig } from "next";

// One id per build, inlined into the client bundle and also served by /version.
// An installed PWA compares the two to notice it is running a stale build: a
// standalone window has no reload button, so nothing else would ever fix it.
const buildId = process.env.BUILD_ID || Date.now().toString(36);

const nextConfig: NextConfig = {
  output: 'standalone',
  generateBuildId: async () => buildId,
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
  // eslint has been moved to eslint.config.mjs
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
      {
        source: '/((?!_next|icons|images|fonts|favicon.ico|.*\\..*).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
