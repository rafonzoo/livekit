import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    optimizePackageImports: [
      '@phosphor-icons/react',
      '@hugeicons/react',
      '@hugeicons/core-free-icons',
    ],
  },
}

export default nextConfig
