
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
      // Common news image hostnames - you may need to add more
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
      // Add other hostnames NewsAPI might return for urlToImage
    ],
  },
};

export default nextConfig;
