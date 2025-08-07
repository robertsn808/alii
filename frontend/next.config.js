/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimization
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Image optimization
  images: {
    domains: [
      'res.cloudinary.com', 
      'images.unsplash.com',
      'aliifishmarket.realconnect.online',
      'realconnect.online',
      'upp.realconnect.online'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https', 
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'realconnect.online',
      },
      {
        protocol: 'https',
        hostname: 'upp.realconnect.online',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Environment variables for production
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    UPP_API_URL: process.env.NEXT_PUBLIC_UPP_API_URL,
    BACKEND_API_URL: process.env.NEXT_PUBLIC_API_URL,
    SELLER_API_URL: process.env.NEXT_PUBLIC_SELLER_API_URL,
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    DEMO_MODE: process.env.DEMO_MODE,
  },
  
  // Build optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog'],
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://aliifishmarket.realconnect.online',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
  // Redirects for SEO and user experience
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/menu',
        destination: '/#menu',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig