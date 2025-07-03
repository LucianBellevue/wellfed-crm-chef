/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Disable ESLint during production builds for Vercel deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during production builds for Vercel deployment
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
