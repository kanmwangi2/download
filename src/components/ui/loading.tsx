import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export function LoadingSpinner({ text = "Loading...", className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-2", className)}>
      <Loader2 className="h-6 w-6 animate-spin" />
      {!!text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
