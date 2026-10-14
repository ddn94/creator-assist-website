"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { useTourPath } from "@/components/TourStage";
import { completeProductTour } from "@/lib/auth/actions";
import type { UserRole } from "@/lib/auth/types";
import { appHomePath } from "@/lib/auth/access";
import {
  TOUR_CLOSED_KEY,
  TOUR_HANDOFF_KEY,
  TOUR_HREF_KEY,
  TOUR_STEP_KEY,
  tourSteps,
} from "@/lib/tour";

type Box = {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
};

type Frame = {
  stepId: string;
  content: Box;
  tab: Box | null;
};

function sameBox(a: Box, b: Box): boolean {
  return (
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height &&
    a.radius === b.radius
  );
}

function sameFrame(current: Frame | null, next: Frame): boolean {
  if (!current || current.stepId !== next.stepId) return false;
  if (!sameBox(current.content, next.content)) return false;
  if (!current.tab || !next.tab) return current.tab === next.tab;
  return sameBox(current.tab, next.tab);
}

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
  return findVisibleAttr("data-tour", name);
}

function findTourTab(href: string): HTMLElement | null {
  return findVisibleAttr("data-tour-tab", href);
}

function findVisibleAttr(attr: string, value: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[${attr}="${value}"]`);
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 8 && rect.height > 8) return node;
  }
  return null;
}

function boxFrom(node: HTMLElement): Box {
  const rect = node.getBoundingClientRect();
  // CSS shrinks a large radius into a pill. SVG clamps each axis on its own
  // and turns the same radius into an ellipse, so cap it here.
  const radius = Math.min(spotlightRadius(node), rect.width / 2, rect.height / 2);
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    radius,
  };
}

export function ProductTour({ role }: { role: UserRole }) {
  const router = useRouter();
  const livePathname = usePathname();
  const tour = useTourPath();
  const pathname = tour?.path ?? livePathname;
  const steps = tourSteps(role);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(TOUR_CLOSED_KEY) === "1") {
      setClosed(true);
      return;
    }
    const saved = Number(sessionStorage.getItem(TOUR_STEP_KEY));
    if (Number.isInteger(saved) && saved >= 0 && saved < steps.length) {
      setIndex(saved);
    }
    setReady(true);
  }, [steps.length]);

  const step = steps[index];

  useEffect(() => {
    const dest = sessionStorage.getItem(TOUR_HANDOFF_KEY);
    if (!dest || dest !== livePathname) return;
    sessionStorage.removeItem(TOUR_HANDOFF_KEY);
    void completeProductTour();
  }, [livePathname]);

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
    if (tour) tour.setPath(href);
    else router.replace(href);
  }, [ready, closed, step, pathname, tour, router]);

  const measure = useCallback(
    (shouldScroll: boolean) => {
      if (!step || !step.matches(pathname)) {
        setFrame((current) => (current === null ? current : null));
        return;
      }
      const node = findVisible(step.target) ?? findVisible(step.fallback);
      const tabNode = findTourTab(step.tab);
      if (!node) {
        setFrame((current) => (current === null ? current : null));
        return;
      }
      if (shouldScroll) {
        const mobile = window.innerWidth < 768;
        node.scrollIntoView({
          block: mobile ? "center" : "nearest",
          inline: "nearest",
        });
        if (!mobile && tabNode) {
          const tabRect = tabNode.getBoundingClientRect();
          if (tabRect.top < 8) window.scrollBy(0, tabRect.top - 12);
        }
      }
      const next = {
        stepId: step.id,
        content: boxFrom(node),
        tab: tabNode ? boxFrom(tabNode) : null,
      };
      setFrame((current) => (sameFrame(current, next) ? current : next));
    },
    [pathname, step],
  );

  useLayoutEffect(() => {
    if (!ready || closed) return;
    measure(true);
  }, [ready, closed, measure]);

  useEffect(() => {
    if (!ready || closed) return;
    let attempts = 0;
    measure(true);
    function spotReady() {
      if (!step || !step.matches(pathname)) return false;
      const node = findVisible(step.target) ?? findVisible(step.fallback);
      return Boolean(node && findTourTab(step.tab));
    }
    const timer = window.setInterval(() => {
      attempts += 1;
      measure(false);
      if (spotReady() || attempts >= 40) window.clearInterval(timer);
    }, 50);
    const observer = new MutationObserver(() => {
      measure(false);
      if (spotReady()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    function onMove() {
      measure(false);
    }
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.clearInterval(timer);
      observer.disconnect();
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [ready, closed, measure, pathname, step]);

  const finish = useCallback((goHome = false) => {
    setClosed(true);
    sessionStorage.setItem(TOUR_CLOSED_KEY, "1");
    sessionStorage.removeItem(TOUR_STEP_KEY);
    sessionStorage.removeItem(TOUR_HREF_KEY);
    const dest = goHome ? appHomePath(role) : (tour?.path ?? livePathname);
    if (tour?.has(dest)) tour.setPath(dest);
    if (livePathname === dest) {
      sessionStorage.removeItem(TOUR_HANDOFF_KEY);
      void completeProductTour();
      return;
    }
    sessionStorage.setItem(TOUR_HANDOFF_KEY, dest);
    router.replace(dest);
  }, [livePathname, role, router, tour]);

  function next() {
    if (!step) return;
    if (index >= steps.length - 1) {
      finish(true);
      return;
    }
    const node = findVisible(step.target);
    const linked = node?.getAttribute("data-tour-href");
    if (linked) sessionStorage.setItem(TOUR_HREF_KEY, linked);
    const nextIndex = index + 1;
    sessionStorage.setItem(TOUR_STEP_KEY, String(nextIndex));
    const following = steps[nextIndex];
    const href = following?.href ?? linked;
    if (href) {
      if (tour) tour.setPath(href);
      else router.push(href);
    }
    setIndex(nextIndex);
  }

  useEffect(() => {
    if (!ready || closed) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") void finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, closed, finish]);

  const placed = frame && frame.stepId === step?.id ? frame : null;

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

  const tip = placeTip(placed.content, placed.tab);

  return createPortal(
    <div className="fixed inset-0 z-90" role="dialog" aria-modal="true" aria-label={step.title}>
      <Dimmer content={placed.content} tab={placed.tab} />
      <div
        className="fixed z-92 w-[18rem] max-w-[calc(100vw-2rem)] rounded-card border border-card-border bg-card p-4 shadow-card"
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

function overlaps(
  box: Box,
  tip: { top: number; left: number },
  width: number,
  height: number,
): boolean {
  return !(
    tip.left + width < box.left ||
    tip.left > box.left + box.width ||
    tip.top + height < box.top ||
    tip.top > box.top + box.height
  );
}

function placeTip(box: Box, tab: Box | null): { top: number; left: number } {
  const margin = 16;
  const width = 288;
  const height = 168;
  const mobile = window.innerWidth < 768;
  const bottomReserve = mobile ? 120 : margin;
  let left = box.left + box.width / 2 - width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  const below = box.top + box.height + 12;
  const above = Math.max(margin, box.top - 12 - height);
  const roomBelow = window.innerHeight - bottomReserve - below;
  let top = roomBelow >= height ? below : above;
  if (tab && overlaps(tab, { top, left }, width, height)) {
    const flipped = top === below ? above : below;
    if (!overlaps(tab, { top: flipped, left }, width, height)) top = flipped;
  }
  return { top, left };
}

function Dimmer({ content, tab }: { content: Box; tab: Box | null }) {
  const holes = tab ? [content, tab] : [content];
  const shade = "rgba(32, 37, 43, 0.5)";
  return (
    <>
      <svg className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden>
        <defs>
          <mask id="tour-spotlight">
            <rect width="100%" height="100%" fill="white" />
            {holes.map((hole, index) => (
              <rect
                key={index}
                x={hole.left}
                y={hole.top}
                width={hole.width}
                height={hole.height}
                rx={hole.radius}
                ry={hole.radius}
                fill="black"
              />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill={shade} mask="url(#tour-spotlight)" />
      </svg>
      <div
        className="pointer-events-none fixed"
        style={{
          top: content.top,
          left: content.left,
          width: content.width,
          height: content.height,
          borderRadius: content.radius,
          boxShadow: "0 14px 36px rgba(32, 37, 43, 0.28)",
        }}
      />
    </>
  );
}
