/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.STANDALONE === 'true' ? { output: 'standalone' } : {}),
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;