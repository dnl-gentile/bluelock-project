import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
  turbopack: {
    resolveAlias: {
      '@views': './src/views',
      '@components': './src/components',
      '@lib': './src/lib',
      '@store': './src/store',
    },
  },
};

export default nextConfig;

