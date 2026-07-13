import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Next.js 16 no longer lints during `next build` by default; keep that
    // behavior on 15.x so pre-existing lint errors don't block production builds.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;