import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent bundling of certain modules on the server side
      config.externals = config.externals || []
      config.externals.push({
        '@supabase/realtime-js': '@supabase/realtime-js',
        'ws': 'ws',
        'utf-8-validate': 'utf-8-validate',
        'bufferutil': 'bufferutil'
      })
    }
    
    // Handle WebSocket and other browser-specific modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }
    
    return config
  },
  poweredByHeader: false,
  reactStrictMode: true,
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
    ],
  },
};

export default nextConfig;
