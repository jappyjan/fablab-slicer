import React from "react";
import { AlertCircle, RotateCcw as RetryIcon } from "lucide-react";

interface ErrorDisplayProps {
  errorMessage: string;
  onRetry?: () => void;
  hasRetry?: boolean;
}

export function ErrorDisplay({
  errorMessage,
  onRetry,
  hasRetry,
}: ErrorDisplayProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="rounded-lg bg-red-50 p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <h3 className="ml-2 text-sm font-medium text-red-800">
            Fehler | Error
          </h3>
        </div>
        <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
      </div>

      {hasRetry && (
        <div className="sticky bottom-4 mt-4 flex justify-end">
          <button
            onClick={onRetry}
            className="group flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <span className="mr-2">Erneut versuchen | Retry</span>
            <RetryIcon className="transform transition-transform duration-300 ease-in-out group-hover:-rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
