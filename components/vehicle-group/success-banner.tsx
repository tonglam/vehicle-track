"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function GroupSuccessBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get("success");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (success) {
      setShow(true);

      // Auto-hide after 5 seconds
      const hideTimer = setTimeout(() => {
        setShow(false);
      }, 5000);

      // Remove from URL after showing
      const cleanupTimer = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("success");
        const newUrl = params.toString()
          ? `?${params.toString()}`
          : window.location.pathname;
        router.replace(newUrl);
      }, 100);

      return () => {
        clearTimeout(hideTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [success, searchParams, router]);

  if (!show || !success) return null;

  const messages = {
    created: "Group created successfully!",
    updated: "Group updated successfully!",
    deleted: "Group deleted successfully!",
  };

  const message =
    messages[success as keyof typeof messages] ||
    "Operation completed successfully!";

  return (
    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-lg animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">{message}</p>
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          className="flex-shrink-0 ml-4 text-green-400 hover:text-green-600 transition-colors"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
