"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "./alert";

interface DismissibleAlertProps {
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
}

export function DismissibleAlert({
  type,
  title,
  message,
}: DismissibleAlertProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClose = () => {
    // Remove the status parameter from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    router.replace(newUrl);
  };

  return (
    <Alert type={type} title={title} message={message} onClose={handleClose} />
  );
}
