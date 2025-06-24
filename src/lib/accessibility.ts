import { useEffect, useRef, type KeyboardEvent } from 'react';

// Accessibility utility functions and hooks

// Focus management hook
export const useFocusManagement = () => {
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const trapFocus = (container: HTMLElement) => {
    const focusable = container.querySelectorAll(focusableElements) as NodeListOf<HTMLElement>;
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    };

    return handleKeyDown;
  };

  const moveFocusToNext = () => {
    const focusable = document.querySelectorAll(focusableElements) as NodeListOf<HTMLElement>;
    const currentIndex = Array.from(focusable).indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusable.length;
    focusable[nextIndex]?.focus();
  };

  const moveFocusToPrevious = () => {
    const focusable = document.querySelectorAll(focusableElements) as NodeListOf<HTMLElement>;
    const currentIndex = Array.from(focusable).indexOf(document.activeElement as HTMLElement);
    const prevIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
    focusable[prevIndex]?.focus();
  };

  return {
    trapFocus,
    moveFocusToNext,
    moveFocusToPrevious,
  };
};

// Auto-focus hook
export const useAutoFocus = (shouldFocus: boolean = true) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [shouldFocus]);

  return elementRef;
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void
) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onEnter?.();
        break;
      case 'Escape':
        e.preventDefault();
        onEscape?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onArrowRight?.();
        break;
    }
  };

  return { handleKeyDown };
};

// Screen reader announcements
export const useAnnouncer = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';

    document.body.appendChild(announcer);
    announcer.textContent = message;

    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  };

  return { announce };
};

// Accessible form field props generator
export const getAccessibleFieldProps = (
  id: string,
  label: string,
  error?: string,
  description?: string,
  required?: boolean
) => {
  const fieldProps = {
    id,
    'aria-describedby': [
      description ? `${id}-description` : '',
      error ? `${id}-error` : '',
    ].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? 'true' : undefined,
    'aria-required': required ? 'true' : undefined,
  };

  const labelProps = {
    htmlFor: id,
  };

  const errorProps = error ? {
    id: `${id}-error`,
    role: 'alert',
    'aria-live': 'polite',
  } : {};

  const descriptionProps = description ? {
    id: `${id}-description`,
  } : {};

  return {
    fieldProps,
    labelProps,
    errorProps,
    descriptionProps,
  };
};

// ARIA helpers
export const createAriaLabel = (base: string, additional?: string) => {
  return additional ? `${base}, ${additional}` : base;
};

export const createAriaDescription = (parts: (string | undefined)[]) => {
  return parts.filter(Boolean).join('. ');
};

// Color contrast checker (basic implementation)
export const checkColorContrast = (foreground: string, background: string): boolean => {
  // This is a simplified version - in a real application, you'd want a more robust implementation
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return 0;
      const [r, g, b] = rgb.slice(0, 3).map(Number);
    const sRGB = [r, g, b].map(c => {
      const normalized = (c ?? 0) / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0]! + 0.7152 * sRGB[1]! + 0.0722 * sRGB[2]!;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return ratio >= 4.5; // WCAG AA standard
};

// Skip link component helper
export const useSkipLinks = () => {
  const createSkipLink = (targetId: string, text: string) => ({
    href: `#${targetId}`,
    className: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary text-primary-foreground p-2 z-50',
    children: text,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = document.getElementById(targetId);
        target?.focus();
      }
    },
  });

  return { createSkipLink };
};

// Reduced motion detection
export const useReducedMotion = () => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  return prefersReducedMotion;
};

// High contrast detection
export const useHighContrast = () => {
  const prefersHighContrast = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-contrast: high)').matches
    : false;

  return prefersHighContrast;
};

// Focus visible utilities
export const useFocusVisible = () => {
  useEffect(() => {
    // Add focus-visible polyfill behavior
    const handleKeyDown = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key === 'Tab') {
        document.body.classList.add('using-keyboard');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('using-keyboard');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
};

// Accessible table helpers
export const getTableA11yProps = (caption?: string) => ({
  role: 'table',
  'aria-label': caption,
});

export const getTableHeaderProps = (sortable?: boolean, sortDirection?: 'asc' | 'desc') => ({
  role: 'columnheader',
  'aria-sort': sortable ? (sortDirection || 'none') : undefined,
  tabIndex: sortable ? 0 : undefined,
});

export const getTableCellProps = (isHeader?: boolean) => ({
  role: isHeader ? 'rowheader' : 'cell',
});

// Live region for dynamic content updates
export const useLiveRegion = () => {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(liveRegion);
    (liveRegionRef as any).current = liveRegion;

    return () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current);
      }
    };
  }, []);

  const updateLiveRegion = (message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
  };

  return { updateLiveRegion };
};
