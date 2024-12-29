import React, { useMemo } from "react";
import { Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  progress?: number | null;
  label: string;
  infinite?: boolean;
}

export function ProgressIndicator({
  progress,
  label,
  infinite,
}: ProgressIndicatorProps) {
  const roundedProgress = useMemo(() => {
    return Math.round(progress ?? 0);
  }, [progress]);

  if (typeof progress !== "number" || infinite) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-2">{label}</span>
      </div>
    );
  }

  return (
    <div className="relative pt-1">
      <div className="flex mb-2 items-center justify-between">
        <div>
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
            {label}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold inline-block text-blue-600">
            {roundedProgress}%
          </span>
        </div>
      </div>
      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
        <div
          style={{ width: `${roundedProgress}%` }}
          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300 ease-out"
        />
      </div>
    </div>
  );
}
