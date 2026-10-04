"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { completeProductTour } from "@/lib/auth/actions";
import type { UserRole } from "@/lib/auth/types";
import { appHomePath } from "@/lib/auth/access";
import { TOUR_HREF_KEY, TOUR_STEP_KEY, tourSteps } from "@/lib/tour";

type Box = {
  stepId: string;
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
};

function cornerRadius(node: HTMLElement): number {
  const value = Number.parseFloat(getComputedStyle(node).borderTopLeftRadius);
  return Number.isFinite(value) ? value : 0;
}

/** Card radius, or the shared radius of a group of cards (the P&L stats). */
function spotlightRadius(node: HTMLElement): number {
  const own = cornerRadius(node);
  if (own > 0) return own;
  const kids = [...node.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
  if (kids.length === 0) return 0;
  const radii = kids.map(cornerRadius);
  const first = radii[0];
  if (first > 0 && radii.every((radius) => radius === first)) return first;
  return 0;
}

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
        stepId: step.id,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        radius: spotlightRadius(node),
      });
    },
    [pathname, step],
  );

  useEffect(() => {
    if (!ready || closed) return;
    let attempts = 0;
    measure(true);
    const timer = window.setInterval(() => {
      attempts += 1;
      const node =
        step && step.matches(pathname)
          ? (findVisible(step.target) ?? findVisible(step.fallback))
          : null;
      measure(false);
      if (node || attempts >= 40) window.clearInterval(timer);
    }, 50);
    function onMove() {
      measure(false);
    }
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [ready, closed, measure]);

  const finish = useCallback(async (goHome = false) => {
    setClosed(true);
    sessionStorage.removeItem(TOUR_STEP_KEY);
    sessionStorage.removeItem(TOUR_HREF_KEY);
    await completeProductTour();
    if (goHome) router.push(appHomePath(role));
    else router.refresh();
  }, [role, router]);

  function next() {
    if (!step) return;
    if (index >= steps.length - 1) {
      void finish(true);
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

  const placed = box && box.stepId === step?.id ? box : null;

  if (
    !ready ||
    closed ||
    !step ||
    !step.matches(pathname) ||
    !placed ||
    typeof document === "undefined"
  ) {
    return null;
  }

  const tip = placeTip(placed, role === "talent");

  return createPortal(
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={step.title}>
      <Dimmer box={placed} />
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
  if (!box) return <div className="fixed inset-0 bg-ink/50" />;
  const shade = "rgba(32, 37, 43, 0.5)";
  return (
    <>
      <svg className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden>
        <defs>
          <mask id="tour-spotlight">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={box.left}
              y={box.top}
              width={box.width}
              height={box.height}
              rx={box.radius}
              ry={box.radius}
              fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill={shade} mask="url(#tour-spotlight)" />
      </svg>
      <div
        className="pointer-events-none fixed"
        style={{
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
          borderRadius: box.radius,
          boxShadow: "0 14px 36px rgba(32, 37, 43, 0.28)",
        }}
      />
    </>
  );
}
