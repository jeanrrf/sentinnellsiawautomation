const withTM = require("next-transpile-modules")(["three"]);

/** @type {import('next').NextConfig} */
const nextConfig = withTM({
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["cdn.shopee.com.br", "images.unsplash.com"],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Polyfills para módulos nativos do Node.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
      };
    }
    return config;
  },
});

module.exports = nextConfig;
