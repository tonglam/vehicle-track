"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Toast } from "@/components/ui/toast";
import { consumePersistedToast, type ToastPayload } from "./toast-storage";

export function PersistedToastListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const searchKey = useMemo(() => searchParams?.toString() ?? "", [searchParams]);

  useEffect(() => {
    const showPersistedToast = () => {
      const nextToast = consumePersistedToast();
      if (nextToast) {
        setToast(nextToast);
      }
    };

    showPersistedToast();

    const handleCustomEvent = () => showPersistedToast();
    window.addEventListener("vehicle-track:toast", handleCustomEvent);

    return () => {
      window.removeEventListener("vehicle-track:toast", handleCustomEvent);
    };
  }, [pathname, searchKey]);

  if (!toast) {
    return null;
  }

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  );
}
