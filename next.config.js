/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Optimizaciones para evitar errores ERR_ABORTED
  experimental: {
    optimizePackageImports: ['@firebase/app', '@firebase/auth', '@firebase/firestore'],
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  // Paquetes externos del servidor
  serverExternalPackages: ['firebase-admin'],
  // Configuración para mejorar el prefetching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  // Configuración para evitar problemas de hidratación
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
