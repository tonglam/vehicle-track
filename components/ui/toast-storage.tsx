"use client";

import { PERSISTED_TOAST_STORAGE_KEY } from "@/lib/constants";
import type { ToastType } from "./toast";

export type ToastPayload = {
  message: string;
  type: ToastType;
};

export function persistToast(toast: ToastPayload) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      PERSISTED_TOAST_STORAGE_KEY,
      JSON.stringify(toast)
    );
    // Notify any listeners on the same page so they can refresh if needed
    window.dispatchEvent(new Event("vehicle-track:toast"));
  } catch (error) {
    console.error("Failed to persist toast:", error);
  }
}

export function consumePersistedToast() {
  if (typeof window === "undefined") return null;

  const stored = sessionStorage.getItem(PERSISTED_TOAST_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as ToastPayload;
  } catch (error) {
    console.error("Failed to parse persisted toast:", error);
    return null;
  } finally {
    sessionStorage.removeItem(PERSISTED_TOAST_STORAGE_KEY);
  }
}
