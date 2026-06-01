import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  // Allow running alongside pro4a-rprmd (port 3000) on port 3001.
  experimental: {
    lockDistDir: false,
  },
};

export default nextConfig;
