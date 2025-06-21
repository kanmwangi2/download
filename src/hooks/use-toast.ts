// This file is deprecated. Toasts have been replaced with in-component feedback messages.
// Direct use of an Alert component or similar within the relevant page/component is preferred.
// Kept for historical reference or if any missed imports exist.
// Consider removing in a future cleanup.

/**
 * @deprecated Use in-component feedback messages (e.g., Alert component) instead of this hook.
 */
export function useToast() {
  // console.warn("useToast.toast() is deprecated. Use in-component feedback messages.");
  return {
    toast: () => { /* No-op */ },
    dismiss: () => { /* No-op */ },
    toasts: [],
  };
}

/**
 * @deprecated Use in-component feedback messages (e.g., Alert component) instead of this hook.
 */
export const toast = () => { /* console.warn("toast() is deprecated. Use in-component feedback messages."); */ };
