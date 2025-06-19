
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Newsdata.io images can come from various sources. These are common ones.
      // You may need to add more as you discover them from image_url fields.
      { protocol: 'https', hostname: '**.reuters.com' },
      { protocol: 'https', hostname: '**.ft.com' },
      { protocol: 'https', hostname: '**.wsj.com' },
      { protocol: 'https', hostname: 'media.cnn.com' },
      { protocol: 'https', hostname: '**.cnn.com' },
      { protocol: 'https', hostname: '**.nytimes.com' },
      { protocol: 'https', hostname: '**.bbc.co.uk' },
      { protocol: 'https', hostname: '**.bbc.com' },
      { protocol: 'https', hostname: 'news.google.com' },
      { protocol: 'https', hostname: '**.google.com' },
      { protocol: 'https', hostname: 's.yimg.com' },
      { protocol: 'https', hostname: '**.theguardian.com' },
      { protocol: 'https', hostname: '**.apnews.com' },
      { protocol: 'https', hostname: '**.techcrunch.com' },
      { protocol: 'https', hostname: '**.theverge.com' },
      { protocol: 'https', hostname: 'img.etimg.com' }, // Example for Economic Times (India)
      { protocol: 'https', hostname: 'images.indianexpress.com' },
      { protocol: 'https', hostname: 'www.aljazeera.com' },
      { protocol: 'https', hostname: 'bloximages.chicago2.vip.townnews.com' },
      { protocol: 'https', hostname: 'afpbb.ismcdn.jp' },
      { protocol: 'https', hostname: 'pxcdn.meridiano.net' },
      { protocol: 'https', hostname: 's-aicmscdn.nhipsongkinhdoanh.vn' },
      { protocol: 'https', hostname: 'vesti.az' },
      { protocol: 'https', hostname: 'keralakaumudi.com' },
      // Generic pattern for newsdata.io itself if they ever proxy images, unlikely but safe.
      { protocol: 'https', hostname: 'cdn.newsdata.io' }, 
      // Add other hostnames Newsdata.io might return for image_url
    ],
  },
};

export default nextConfig;
