// Standard error types for the application
export type AppErrorType = 
  | 'NETWORK_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppError {
  type: AppErrorType;
  message: string;
  details?: string | undefined;
  code?: string | undefined;
  timestamp: Date;
}

// Create standardized error objects
export const createAppError = (
  type: AppErrorType,
  message: string,
  details?: string | undefined,
  code?: string | undefined
): AppError => ({
  type,
  message,
  ...(details !== undefined && { details }),
  ...(code !== undefined && { code }),
  timestamp: new Date(),
});

// Handle Supabase errors consistently
export const handleSupabaseError = (error: unknown): AppError => {
  if (!error) {
    return createAppError('UNKNOWN_ERROR', 'An unknown error occurred');
  }

  // Handle authentication errors
  if (error.message?.includes('JWT') || error.message?.includes('auth')) {
    return createAppError(
      'AUTHENTICATION_ERROR',
      'Authentication failed. Please sign in again.',
      error.message,
      error.code
    );
  }

  // Handle permission errors
  if (error.message?.includes('permission') || error.message?.includes('RLS')) {
    return createAppError(
      'PERMISSION_ERROR',
      'You do not have permission to perform this action.',
      error.message,
      error.code
    );
  }

  // Handle validation errors
  if (error.message?.includes('violates') || error.message?.includes('constraint')) {
    return createAppError(
      'VALIDATION_ERROR',
      'The data provided is invalid.',
      error.message,
      error.code
    );
  }

  // Handle network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return createAppError(
      'NETWORK_ERROR',
      'Network error. Please check your connection and try again.',
      error.message,
      error.code
    );
  }

  // Default to database error for other Supabase errors
  return createAppError(
    'DATABASE_ERROR',
    'A database error occurred. Please try again.',
    error.message,
    error.code
  );
};

// Display error to user with consistent messaging
export const displayError = (error: AppError, showToast = true) => {
  console.error('Application Error:', error);

  if (showToast) {
    // Note: Toast implementation may vary - update according to your toast hook
    console.warn('Error to display:', {
      title: getErrorTitle(error.type),
      description: error.message,
    });
  }

  // In production, log to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error reporting service (Sentry, LogRocket, etc.)
    console.error('Production error logged:', {
      type: error.type,
      message: error.message,
      details: error.details,
      code: error.code,
      timestamp: error.timestamp.toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }
};

// Get user-friendly error titles
const getErrorTitle = (type: AppErrorType): string => {
  switch (type) {
    case 'NETWORK_ERROR':
      return 'Connection Error';
    case 'AUTHENTICATION_ERROR':
      return 'Authentication Required';
    case 'VALIDATION_ERROR':
      return 'Invalid Data';
    case 'PERMISSION_ERROR':
      return 'Access Denied';
    case 'DATABASE_ERROR':
      return 'Database Error';
    case 'UNKNOWN_ERROR':
    default:
      return 'Unexpected Error';
  }
};

// Async operation wrapper with error handling
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorContext?: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    const appError = handleSupabaseError(error);
    
    if (errorContext) {
      appError.details = `${errorContext}: ${appError.details}`;
    }
    
    displayError(appError);
    return null;
  }
};

// Validation helper for common form patterns
export const validateRequired = (value: unknown, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }
  return null;
};

// Form validation helper
export const validateForm = (data: Record<string, unknown>, rules: Record<string, (value: unknown) => string | null>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  for (const [field, validator] of Object.entries(rules)) {
    const error = validator(data[field]);
    if (error) {
      errors[field] = error;
    }
  }
  
  return errors;
};
