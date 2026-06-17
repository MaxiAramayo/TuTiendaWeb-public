/** @type {import('next').NextConfig} */
const useFirebaseEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

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
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      // Emulador local de Storage (solo cuando está activo). Permite que next/image
      // sirva las imágenes subidas al emulador en desarrollo.
      ...(useFirebaseEmulator
        ? [
            {
              protocol: 'http',
              hostname: '127.0.0.1',
              port: '9199',
              pathname: '/**',
            },
            {
              protocol: 'http',
              hostname: 'localhost',
              port: '9199',
              pathname: '/**',
            },
          ]
        : []),
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
