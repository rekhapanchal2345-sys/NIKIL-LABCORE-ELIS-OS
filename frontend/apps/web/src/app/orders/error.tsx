"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("OrderList Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
      <h2 className="text-xl font-semibold text-red-500">Something went wrong!</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md text-center">
        {error.message || "An unexpected error occurred while loading orders."}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
