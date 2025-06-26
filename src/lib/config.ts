/**
 * Environment Variable Configuration and Validation
 * Ensures all required environment variables are present and properly typed
 */

const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL;

// Define the shape of environment variables
interface EnvironmentConfig {
  // Supabase configuration
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;

  // Application configuration
  nodeEnv: 'development' | 'production' | 'test';
  nextPublicAppUrl: string;
  
  // Optional features
  enableAnalytics?: boolean;
  enableErrorReporting?: boolean;
  
  // Security
  jwtSecret?: string;
  encryptionKey?: string;
}

// Validate and parse environment variables
const validateEnvironment = (): EnvironmentConfig => {
  const env = process.env;

  // Required variables
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const nodeEnv = env.NODE_ENV || 'development';
  const nextPublicAppUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Check for missing required variables - but be lenient during build
  const missingVars: string[] = [];
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missingVars.length > 0 && !isBuildTime) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  // Validate node environment
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}. Must be 'development', 'production', or 'test'.`);
  }

  // Validate URLs
  try {
    new URL(supabaseUrl!);
    new URL(nextPublicAppUrl);  } catch {
    throw new Error('Invalid URL format in environment variables');
  }
  return {
    supabaseUrl: supabaseUrl!,
    supabaseAnonKey: supabaseAnonKey!,
    nodeEnv: nodeEnv as 'development' | 'production' | 'test',
    nextPublicAppUrl,
    enableAnalytics: env.ENABLE_ANALYTICS === 'true',
    enableErrorReporting: env.ENABLE_ERROR_REPORTING === 'true',
    ...(env.SUPABASE_SERVICE_ROLE_KEY && { supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY }),
    ...(env.JWT_SECRET && { jwtSecret: env.JWT_SECRET }),
    ...(env.ENCRYPTION_KEY && { encryptionKey: env.ENCRYPTION_KEY }),
  };
};

// Export the validated configuration
export const config = validateEnvironment();

// Helper functions for environment checks
export const isDevelopment = () => config.nodeEnv === 'development';
export const isProduction = () => config.nodeEnv === 'production';
export const isTest = () => config.nodeEnv === 'test';

// Security helpers
export const getSecureConfig = () => {
  if (!isProduction()) {
    console.warn('Accessing secure configuration in non-production environment');
  }
  
  return {
    serviceRoleKey: config.supabaseServiceRoleKey,
    jwtSecret: config.jwtSecret,
    encryptionKey: config.encryptionKey,
  };
};

// Log configuration (safe for production)
export const logConfig = () => {
  const safeConfig = {
    nodeEnv: config.nodeEnv,
    supabaseUrl: config.supabaseUrl,
    appUrl: config.nextPublicAppUrl,
    enableAnalytics: config.enableAnalytics,
    enableErrorReporting: config.enableErrorReporting,
    hasServiceRoleKey: !!config.supabaseServiceRoleKey,
    hasJwtSecret: !!config.jwtSecret,
    hasEncryptionKey: !!config.encryptionKey,
  };

  console.log('Environment Configuration:', safeConfig);
};

// Runtime configuration validation
export const validateRuntimeConfig = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Client-side validation
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error('Client-side Supabase configuration is incomplete');
    }
  } else {
    // Server-side validation
    if (isProduction() && !config.supabaseServiceRoleKey) {
      console.warn('Service role key not configured for production environment');
    }
  }
};

// Content Security Policy configuration
export const getCSPConfig = () => {
  const isSecure = isProduction();
  
  return {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Only for development
      "'unsafe-eval'", // Only for development
      ...(isSecure ? [] : ["'unsafe-inline'", "'unsafe-eval'"]),
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      config.supabaseUrl,
    ],
    'connect-src': [
      "'self'",
      config.supabaseUrl,
      ...(isDevelopment() ? ['ws://localhost:*'] : []),
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': isSecure ? [] : undefined,
  };
};

// Initialize and validate on module load
try {
  validateRuntimeConfig();
  if (isDevelopment()) {
    logConfig();
  }
} catch (error) {
  console.error('Environment configuration error:', error);
  if (isProduction()) {
    process.exit(1);
  }
}
