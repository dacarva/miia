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
  // Disable all testing during build
  env: {
    SKIP_TESTS: 'true',
  },
}

module.exports = nextConfig
