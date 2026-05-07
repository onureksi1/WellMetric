/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ['tr', 'en'],
    defaultLocale: 'tr',
    localeDetection: false,
  },
  async rewrites() {
    // NEXT_PUBLIC_API_URL must be the API root WITHOUT /api/v1 (e.g. https://api.wellbeingmetric.com)
    // so the rewrite doesn't double the path: /api/v1/foo -> API_ROOT/api/v1/foo
    const apiRoot = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001').replace(/\/api\/v1\/?$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiRoot}/api/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // S3/R2 bucket domain
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
