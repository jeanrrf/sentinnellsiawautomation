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
  // Atualizado para Next.js 15.2.4
  serverExternalPackages: ['puppeteer-core', 'chrome-aws-lambda', 'fluent-ffmpeg'],
  webpack: (config) => {
    // Configuração para lidar com módulos binários
    config.resolve.alias = {
      ...config.resolve.alias,
      'sharp$': false,
      'canvas$': false,
    };
    
    // Ignorar arquivos .map que estão causando erros
    config.module.rules.push({
      test: /\.map$/,
      use: 'ignore-loader',
      include: /node_modules\/chrome-aws-lambda/,
    });
    
    return config;
  },
  // Adicionar configurações de segurança
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ];
  },
}

export default nextConfig
