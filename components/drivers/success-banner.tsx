"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const messages: Record<string, string> = {
  created: "Driver created successfully!",
  updated: "Driver updated successfully!",
};

export function DriverSuccessBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!status) return;
    setVisible(true);

    const hideTimer = setTimeout(() => setVisible(false), 5000);
    const cleanupTimer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("status");
      const next = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname;
      router.replace(next);
    }, 200);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(cleanupTimer);
    };
  }, [status, searchParams, router]);

  if (!status || !visible) {
    return null;
  }

  const message = messages[status] ?? "Driver updated";

  return (
    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-green-500">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-green-800">{message}</p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-green-500 hover:text-green-700"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
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
