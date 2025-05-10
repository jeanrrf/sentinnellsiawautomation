/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', 'chrome-aws-lambda', 'fluent-ffmpeg'],
  },
  images: {
    domains: ['cf.shopee.com.br', 'down-br.img.susercontent.com'],
    unoptimized: true,
  },
  webpack: (config) => {
    // Configuração para lidar com módulos binários
    config.resolve.alias = {
      ...config.resolve.alias,
      'sharp$': false,
      'canvas$': false,
    };
    
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
