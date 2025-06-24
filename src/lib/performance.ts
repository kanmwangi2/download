import { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import React from 'react';

// Performance monitoring utilities
export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof window !== 'undefined' && window.performance) {
    const start = window.performance.now();
    fn();
    const end = window.performance.now();
    console.warn(`${name} took ${end - start} milliseconds`);
  } else {
    fn();
  }
};

// Custom hook for expensive computations
export const useExpensiveComputation = <T>(
  computeFn: () => T,
  dependencies: React.DependencyList
): T => {
  return useMemo(computeFn, dependencies);
};

// Custom hook for stable callback references  
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T => {
  return useCallback(callback, dependencies);
};

// Debounced callback hook
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  dependencies: React.DependencyList
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [...dependencies, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Virtual scrolling helper
export const useVirtualScrolling = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 1, itemCount);

    return {
      start,
      end,
      offsetY: start * itemHeight,
      totalHeight: itemCount * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, itemCount]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
  };
};

// Higher-order component for memoizing components
export const withMemo = <P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return memo(Component, areEqual);
};
