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
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com', pathname: '**' },
      { protocol: 'https', hostname: 'example.com', pathname: '**' },
      { protocol: 'https', hostname: 'wellfedpics.blob.core.windows.net', pathname: '**' },
    ],
    unoptimized: true,
    domains: ['api.wellfedapp.com', 'www.wellfedapp.com', 'wellfedpics.blob.core.windows.net'],
  },
}

module.exports = nextConfig
