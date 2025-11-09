/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
    devIdicators: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
