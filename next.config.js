/** @type {import('next').NextConfig} */
const nextConfig = {
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