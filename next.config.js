/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: { unoptimized: true },
  // 使用相对路径，确保在 Electron 的 file:// 协议下正常工作
  assetPrefix: './',
  basePath: '',
  webpack: (config, { isServer }) => {
    // 解决 undici 的 ES2022 语法问题
    if (isServer) {
      config.externals.push('undici');
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['undici'],
  },
}

module.exports = nextConfig