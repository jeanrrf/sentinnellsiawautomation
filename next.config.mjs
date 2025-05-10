/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['cf.shopee.com.br', 'down-br.img.susercontent.com'],
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', 'puppeteer', 'sharp'],
  },
}

export default nextConfig
