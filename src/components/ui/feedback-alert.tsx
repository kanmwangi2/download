import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from '@/lib/utils';

export type FeedbackType = 'success' | 'error' | 'info' | 'warning';

export interface FeedbackMessage {
  type: FeedbackType;
  message: string;
  details?: string;
}

interface FeedbackAlertProps {
  feedback: FeedbackMessage | null;
  className?: string;
}

/**
 * Reusable feedback alert component that can be used in dialogs or page content
 * Uses the same styling and logic pattern established throughout the app
 */
export function FeedbackAlert({ feedback, className }: FeedbackAlertProps) {
  if (!feedback) return null;

  let IconComponent;
  let variant: "default" | "destructive" = "default";
  let additionalAlertClasses = "";

  switch (feedback.type) {
    case 'success':
      IconComponent = CheckCircle2;
      variant = "default";
      additionalAlertClasses = "bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600 [&>svg]:text-green-600 dark:[&>svg]:text-green-400";
      break;
    case 'error':
      IconComponent = AlertTriangle;
      variant = "destructive";
      break;
    case 'info':
      IconComponent = Info;
      variant = "default";
      additionalAlertClasses = "bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-600 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400";
      break;
    case 'warning':
      IconComponent = AlertCircle;
      variant = "default";
      additionalAlertClasses = "bg-yellow-100 border-yellow-400 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-600 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400";
      break;
    default:
      return null;
  }

  return (
    <Alert variant={variant} className={cn("mb-4", additionalAlertClasses, className)}>
      <IconComponent className="h-4 w-4" />
      <AlertTitle>{feedback.message}</AlertTitle>
      {Boolean(feedback.details) && <AlertDescription>{feedback.details}</AlertDescription>}
    </Alert>
  );
}
