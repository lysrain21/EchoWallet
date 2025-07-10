/**
 * Echo Wallet - Next.js 配置
 * 专为无障碍访问优化的配置
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 开启实验性功能
  experimental: {
    // 支持Web Assembly
    webVitalsAttribution: ['CLS', 'LCP']
  },

  // 编译配置
  transpilePackages: ['@radix-ui/react-alert-dialog', '@radix-ui/react-dialog'],

  // 图片优化
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  },

  // 头部配置（SEO和可访问性）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()'
          }
        ]
      }
    ]
  },

  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Webpack配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 添加对.wasm文件的支持
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }

    // 优化bundle大小
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all'
    }

    return config
  }
}

module.exports = nextConfig
