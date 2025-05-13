/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['cf.shopee.com.br', 'down-lum-br.img.susercontent.com'],
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['canvas', 'sharp'],
  },
  transpilePackages: ['@vercel/og'],
  webpack: (config) => {
    // Configuração para suportar canvas no servidor
    config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    
    // Adiciona suporte para JSX em arquivos de API
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: ['next/babel'],
          },
        },
      ],
    });
    
    return config;
  },
}

export default nextConfig;
