import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { handleSupabaseError, displayError, withErrorHandling } from '@/lib/error-handling';

// Custom hook for Supabase data fetching
export const useSupabaseQuery = <T>(
  query: () => Promise<{ data: T | null; error: any }>,
  dependencies: React.DependencyList = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await query();
      if (result.error) {
        const appError = handleSupabaseError(result.error);
        setError(appError.message);
        displayError(appError);
      } else {
        setData(result.data);
      }
    } catch (err) {
      const appError = handleSupabaseError(err);
      setError(appError.message);
      displayError(appError);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};

// Custom hook for form state management
export const useFormState = <T extends Record<string, any>>(
  initialState: T,
  validationRules?: Record<keyof T, (value: any) => string | null>
) => {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setTouched = useCallback((field: keyof T) => {
    setTouchedState(prev => ({ ...prev, [field]: true }));
  }, []);

  const validate = useCallback(() => {
    if (!validationRules) return true;

    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const [field, validator] of Object.entries(validationRules)) {
      const error = validator(values[field as keyof T]);
      if (error) {
        newErrors[field as keyof T] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);
  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialState]);

  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void>
  ) => {
    setIsSubmitting(true);
    
    if (!validate()) {
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(values);
      reset();
    } catch (error) {
      const appError = handleSupabaseError(error);
      displayError(appError);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, reset]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setTouched,
    validate,
    reset,
    handleSubmit,
  };
};

// Custom hook for pagination
export const usePagination = (
  totalItems: number,
  itemsPerPage: number = 10,
  initialPage: number = 1
) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    reset,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

// Custom hook for local storage with Supabase sync
export const useLocalStorageSync = <T>(
  key: string,
  initialValue: T,
  supabaseSync?: {
    table: string;
    column: string;
    userId: string;
  }
) => {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback(async (newValue: T) => {
    setValue(newValue);
    
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }    // Sync to Supabase if configured
    if (supabaseSync) {
      await withErrorHandling(async () => {
        const supabase = createClient();
        return await supabase
          .from(supabaseSync.table)
          .upsert({
            user_id: supabaseSync.userId,
            [supabaseSync.column]: newValue,
          });
      }, 'Syncing preferences to Supabase');
    }
  }, [key, supabaseSync]);

  return [value, setStoredValue] as const;
};

// Custom hook for async operations with loading states
export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    errorContext?: string
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();
      return result;
    } catch (err) {
      const appError = handleSupabaseError(err);
      if (errorContext) {
        appError.details = `${errorContext}: ${appError.details}`;
      }
      setError(appError.message);
      displayError(appError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset,
  };
};

// Custom hook for window size
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

// Custom hook for media queries
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};
