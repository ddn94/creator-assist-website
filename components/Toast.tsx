"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckIcon, XIcon } from "@phosphor-icons/react";

export type ToastTone = "success" | "danger";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

const TOAST_COOKIE = "ca-toast";
const TOAST_MS = 1500;
const listeners = new Set<(items: ToastItem[]) => void>();
const timers = new Map<string, number>();
let items: ToastItem[] = [];

function publish() {
  const next = items;
  listeners.forEach((listener) => listener(next));
}

function dismiss(id: string) {
  const timer = timers.get(id);
  if (timer) window.clearTimeout(timer);
  timers.delete(id);
  items = items.filter((item) => item.id !== id);
  publish();
}

export function showToast(message: string, tone: ToastTone = "success") {
  const id = crypto.randomUUID();
  items = [...items, { id, message, tone }];
  publish();
  timers.set(
    id,
    window.setTimeout(() => dismiss(id), TOAST_MS),
  );
}

function readFlash() {
  const parts = document.cookie.split("; ");
  const raw = parts.find((part) => part.startsWith(`${TOAST_COOKIE}=`));
  if (!raw) return;
  document.cookie = `${TOAST_COOKIE}=; Max-Age=0; path=/`;
  try {
    const encoded = decodeURIComponent(raw.slice(TOAST_COOKIE.length + 1));
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as {
      message?: string;
      tone?: ToastTone;
    };
    if (parsed.message) showToast(parsed.message, parsed.tone ?? "success");
  } catch {
    return;
  }
}

export function ToastHost() {
  const pathname = usePathname();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  useEffect(() => {
    readFlash();
  }, [pathname]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-3 right-4 z-80 flex w-[min(22rem,calc(100%-2rem))] flex-col gap-2">
      {toasts.map((toast) => {
        const danger = toast.tone === "danger";
        return (
          <div
            key={toast.id}
            role="status"
            className={[
              "pointer-events-auto relative overflow-hidden rounded-input text-on-primary shadow-card",
              danger ? "bg-danger" : "bg-primary",
            ].join(" ")}
          >
            <div className="flex items-center gap-3 px-4 py-4">
              <CheckIcon size={18} weight="bold" aria-hidden className="shrink-0" />
              <p className="min-w-0 flex-1 font-sans text-sm font-medium">
                {toast.message}
              </p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 cursor-pointer text-on-primary"
              >
                <XIcon size={16} weight="bold" aria-hidden />
              </button>
            </div>
            <div
              className="absolute inset-x-0 bottom-0 h-1 origin-left bg-on-primary/45"
              style={{ animation: `toast-timer ${TOAST_MS}ms linear forwards` }}
            />
          </div>
        );
      })}
    </div>
  );
}
