import { useState } from 'react';
import type { FeedbackMessage } from '@/components/ui/feedback-alert';

/**
 * Custom hook for managing feedback messages within dialogs
 * Uses the same feedback system as the rest of the app for consistency
 */
export function useDialogFeedback() {
  const [dialogFeedback, setDialogFeedback] = useState<FeedbackMessage | null>(null);

  const showSuccess = (message: string, details?: string) => {
    setDialogFeedback({ type: 'success', message, ...(details && { details }) });
  };

  const showError = (message: string, details?: string) => {
    setDialogFeedback({ type: 'error', message, ...(details && { details }) });
  };

  const showInfo = (message: string, details?: string) => {
    setDialogFeedback({ type: 'info', message, ...(details && { details }) });
  };

  const showWarning = (message: string, details?: string) => {
    setDialogFeedback({ type: 'warning', message, ...(details && { details }) });
  };

  const clearFeedback = () => {
    setDialogFeedback(null);
  };

  return {
    dialogFeedback,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearFeedback,
    setDialogFeedback
  };
}
