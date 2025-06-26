import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      // Prevent bundling of certain modules on the server side
      config.externals = config.externals || []
      config.externals.push({
        '@supabase/realtime-js': '@supabase/realtime-js',
        '@supabase/auth-js': '@supabase/auth-js',
        '@supabase/gotrue-js': '@supabase/gotrue-js',
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

    // Prevent problematic modules from being processed during static generation
    if (!dev && isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@supabase/auth-js': false,
        '@supabase/gotrue-js': false,
      }
    }
    
    return config
  },
  // Experimental features to help with build stability
  experimental: {
    // Disable server-side rendering for problematic components during build
    serverComponentsHmrCache: false,
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
