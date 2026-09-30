"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { completeProductTour } from "@/lib/auth/actions";
import type { UserRole } from "@/lib/auth/types";
import { TOUR_HREF_KEY, TOUR_STEP_KEY, tourSteps } from "@/lib/tour";

type Box = { top: number; left: number; width: number; height: number };

const PAD = 8;

function findVisible(name: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 8 && rect.height > 8) return node;
  }
  return null;
}

export function ProductTour({ role }: { role: UserRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const steps = tourSteps(role);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const saved = Number(sessionStorage.getItem(TOUR_STEP_KEY));
    if (Number.isInteger(saved) && saved >= 0 && saved < steps.length) {
      setIndex(saved);
    }
    setReady(true);
  }, [steps.length]);

  const step = steps[index];

  useEffect(() => {
    if (!ready || closed || !step) return;
    if (step.matches(pathname)) return;
    const href =
      step.href ?? sessionStorage.getItem(TOUR_HREF_KEY);
    if (!href) {
      setIndex(0);
      sessionStorage.setItem(TOUR_STEP_KEY, "0");
      return;
    }
    router.replace(href);
  }, [ready, closed, step, pathname, router]);

  const measure = useCallback(
    (shouldScroll: boolean) => {
      if (!step || !step.matches(pathname)) {
        setBox(null);
        return;
      }
      const node = findVisible(step.target) ?? findVisible(step.fallback);
      if (!node) {
        setBox(null);
        return;
      }
      if (shouldScroll) {
        node.scrollIntoView({ block: "center", inline: "nearest" });
      }
      const rect = node.getBoundingClientRect();
      setBox({
        top: Math.max(8, rect.top - PAD),
        left: Math.max(8, rect.left - PAD),
        width: Math.min(rect.width + PAD * 2, window.innerWidth - 16),
        height: rect.height + PAD * 2,
      });
    },
    [pathname, step],
  );

  useEffect(() => {
    if (!ready || closed) return;
    const timers = [0, 120, 320].map((delay, attempt) =>
      window.setTimeout(() => measure(attempt === 0), delay),
    );
    function onMove() {
      measure(false);
    }
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [ready, closed, measure]);

  const finish = useCallback(async () => {
    setClosed(true);
    sessionStorage.removeItem(TOUR_STEP_KEY);
    sessionStorage.removeItem(TOUR_HREF_KEY);
    await completeProductTour();
    router.refresh();
  }, [router]);

  function next() {
    if (!step) return;
    if (index >= steps.length - 1) {
      void finish();
      return;
    }
    const node = findVisible(step.target);
    const linked = node?.getAttribute("data-tour-href");
    if (linked) sessionStorage.setItem(TOUR_HREF_KEY, linked);
    const nextIndex = index + 1;
    sessionStorage.setItem(TOUR_STEP_KEY, String(nextIndex));
    setIndex(nextIndex);
    const following = steps[nextIndex];
    const href = following?.href ?? linked;
    if (href) router.push(href);
  }

  useEffect(() => {
    if (!ready || closed) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") void finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, closed, finish]);

  if (!ready || closed || !step || !step.matches(pathname) || typeof document === "undefined") {
    return null;
  }

  const tip = placeTip(box, role === "talent");

  return createPortal(
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={step.title}>
      <Dimmer box={box} />
      {box ? (
        <div
          className="pointer-events-none fixed z-[91] rounded-card ring-2 ring-primary"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
          }}
        />
      ) : null}
      <div
        className="fixed z-[92] w-[18rem] max-w-[calc(100vw-2rem)] rounded-card border border-card-border bg-card p-4 shadow-card"
        style={{ top: tip.top, left: tip.left }}
      >
        <Text variant="caption" className="font-medium">
          {index + 1} of {steps.length}
        </Text>
        <Text variant="cardTitle" className="mt-1 text-base">
          {step.title}
        </Text>
        <Text variant="caption" className="mt-1.5 text-sm text-ink">
          {step.body}
        </Text>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" size="xs" onClick={() => void finish()}>
            Skip
          </Button>
          <Button type="button" size="xs" onClick={next}>
            {index === steps.length - 1 ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function placeTip(box: Box | null, talent: boolean): { top: number; left: number } {
  const margin = 16;
  const width = 288;
  const height = 168;
  const bottomReserve = talent ? 112 : margin;
  if (!box || typeof window === "undefined") {
    return { top: margin, left: margin };
  }
  let left = box.left + box.width / 2 - width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  const below = box.top + box.height + 12;
  const roomBelow = window.innerHeight - bottomReserve - below;
  const top =
    roomBelow >= height
      ? below
      : Math.max(margin, box.top - 12 - height);
  return { top, left };
}

function Dimmer({ box }: { box: Box | null }) {
  const shade = "bg-ink/50";
  if (!box) return <div className={`fixed inset-0 ${shade}`} />;
  const right = Math.max(0, box.left);
  const bottom = box.top + box.height;
  return (
    <>
      <div className={`fixed left-0 right-0 top-0 ${shade}`} style={{ height: box.top }} />
      <div
        className={`fixed left-0 ${shade}`}
        style={{ top: box.top, width: right, height: box.height }}
      />
      <div
        className={`fixed right-0 ${shade}`}
        style={{ top: box.top, left: box.left + box.width, height: box.height }}
      />
      <div className={`fixed left-0 right-0 bottom-0 ${shade}`} style={{ top: bottom }} />
    </>
  );
}
