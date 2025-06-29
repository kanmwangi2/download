// Environment variables and security utilities

// Environment variable validation
export const validateEnvironmentVariables = () => {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.warn('Supabase URL should use HTTPS in production');
  }

  return true;
};

// Check if we're in development mode
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isTesting = () => process.env.NODE_ENV === 'test';

// Safe environment variable access
export const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value || defaultValue || '';
};

// Content Security Policy headers
export const getCSPHeader = (): string => {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-* should be avoided in production
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.io",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];

  return cspDirectives.join('; ');
};

// Security headers
export const getSecurityHeaders = () => {
  return {
    'Content-Security-Policy': getCSPHeader(),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
};

// Sanitize user input
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Validate file upload security
export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size exceeds 5MB limit' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' };
  }

  // Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeTypeExtensionMap: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf'],
    'text/csv': ['csv'],
    'application/vnd.ms-excel': ['xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx']
  };

  const expectedExtensions = mimeTypeExtensionMap[file.type];
  if (expectedExtensions && extension && !expectedExtensions.includes(extension)) {
    return { isValid: false, error: 'File extension does not match file type' };
  }

  return { isValid: true };
};

// Rate limiting utilities (basic client-side)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  key: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};

// API key validation
export const validateApiKey = (apiKey: string): boolean => {
  // Basic validation - check if it looks like a Supabase key
  const supabaseKeyPattern = /^[a-zA-Z0-9._-]{100,}$/;
  return supabaseKeyPattern.test(apiKey);
};

// Secure data transmission utilities
export const encodeForTransmission = (data: unknown): string => {
  return btoa(JSON.stringify(data));
};

export const decodeFromTransmission = (encoded: string): unknown => {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    throw new Error('Invalid encoded data');
  }
};

// Security logging
export const logSecurityEvent = (
  event: string, 
  details: Record<string, unknown> = {},
  severity: 'low' | 'medium' | 'high' = 'medium'
) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    severity,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown'
  };

  if (isProduction()) {
    // In production, you would send this to a logging service
    // console.warn('Security Event:', logEntry);
  } else {
    console.log('Security Event:', logEntry);
  }
};

// Session security
export const validateSession = (sessionData: unknown): boolean => {
  if (!sessionData || typeof sessionData !== 'object') {
    return false;
  }

  // Check if session has expired
  if (sessionData.expires_at && Date.now() > sessionData.expires_at * 1000) {
    logSecurityEvent('session_expired', { userId: sessionData.user?.id });
    return false;
  }

  // Validate required session properties
  const requiredProps = ['access_token', 'user'];
  for (const prop of requiredProps) {
    if (!sessionData[prop]) {
      logSecurityEvent('invalid_session_structure', { missingProperty: prop });
      return false;
    }
  }

  return true;
};

// Initialize security on app start
export const initializeSecurity = () => {
  // Validate environment variables
  try {
    validateEnvironmentVariables();
  } catch (error) {
    console.error('Environment validation failed:', error);
    if (isProduction()) {
      // In production, you might want to prevent app startup
      throw error;
    }
  }

  // Set up global error handlers for security
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      logSecurityEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      logSecurityEvent('unhandled_promise_rejection', {
        reason: event.reason?.toString()
      });
    });
  }

  console.log('Security initialized');
};
