
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
      // Newsdata.io images (still useful as NewsAPI also links to diverse sources)
      { protocol: 'https', hostname: '**.reuters.com' },
      { protocol: 'https', hostname: '**.ft.com' },
      { protocol: 'https', hostname: '**.wsj.com' },
      { protocol: 'https', hostname: 'media.cnn.com' },
      { protocol: 'https', hostname: '**.cnn.com' },
      { protocol: 'https', hostname: '**.nytimes.com' },
      { protocol: 'https', hostname: '**.bbc.co.uk' },
      { protocol: 'https', hostname: '**.bbc.com' },
      { protocol: 'https', hostname: 'news.google.com' },
      { protocol: 'https', hostname: '**.google.com' }, // General Google for images
      { protocol: 'https', hostname: 's.yimg.com' },
      { protocol: 'https', hostname: '**.theguardian.com' }, // Also a direct API source
      { protocol: 'https', hostname: '**.apnews.com' },
      { protocol: 'https', hostname: '**.techcrunch.com' },
      { protocol: 'https', hostname: '**.theverge.com' },
      { protocol: 'https', hostname: 'img.etimg.com' },
      { protocol: 'https', hostname: 'images.indianexpress.com' },
      { protocol: 'https', hostname: 'www.aljazeera.com' },
      { protocol: 'https', hostname: 'bloximages.chicago2.vip.townnews.com' },
      { protocol: 'https', hostname: 'afpbb.ismcdn.jp' },
      { protocol: 'https', hostname: 'pxcdn.meridiano.net' },
      { protocol: 'https', hostname: 's-aicmscdn.nhipsongkinhdoanh.vn' },
      { protocol: 'https', hostname: 'vesti.az' },
      { protocol: 'https', hostname: 'keralakaumudi.com' },
      { protocol: 'https', hostname: 'cdn.newsdata.io' },
      // NewsAPI.org - often links to publisher sites, but add if it ever proxies
      // No specific domain for NewsAPI.org itself as it links out, but some images might come from generic CDNs
      // Check for common CDNs used by news outlets if more errors appear.
      // Example: If NewsAPI used its own CDN: { protocol: 'https', hostname: 'newsapi.org' }
      // The Guardian is already covered by **.theguardian.com
      // Mediastack: similar to others, it will link to source domains.
    ],
  },
};

export default nextConfig;
