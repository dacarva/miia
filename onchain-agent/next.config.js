/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during build for hackathon
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during build for hackathon
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
