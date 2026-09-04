import type { NextConfig } from 'next';

/**
 * The public front door is the approved four-screen GameBoost + Agent site.
 * Keep the App Router in place for reports, P1 case pages, APIs and the
 * optimizer console; this before-files rewrite only chooses the homepage.
 */
const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/gameboost-home-v2.html' },
      ],
    };
  },
};

export default nextConfig;
