"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { controlSizes, fieldText, type ControlSize } from "@/lib/control";
import { toDateInput } from "@/lib/timestamps";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

type DateFieldProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  size?: ControlSize;
  full?: boolean;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  onChange?: (value: string) => void;
};

type MenuCoords = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  placement: "below" | "above";
};

function parseDateOnly(value: string): Date | null {
  const dayKey = toDateInput(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return null;
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplay(value: string): string {
  const date = parseDateOnly(value);
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Monday-first index 0–6 for a JS Date.getDay() value. */
function mondayIndex(day: number) {
  return (day + 6) % 7;
}

function buildMonthCells(month: Date) {
  const first = startOfMonth(month);
  const startOffset = mondayIndex(first.getDay());
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function measureCoords(field: HTMLElement): MenuCoords {
  const rect = field.getBoundingClientRect();
  const gap = 6;
  const menuWidth = Math.max(rect.width, 288);
  const menuHeight = 320;
  const spaceBelow = window.innerHeight - rect.bottom - gap;
  const spaceAbove = rect.top - gap;
  const placement: MenuCoords["placement"] =
    spaceBelow < menuHeight && spaceAbove > spaceBelow ? "above" : "below";

  let left = rect.left;
  if (left + menuWidth > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - menuWidth - 8);
  }

  if (placement === "below") {
    return {
      top: rect.bottom + gap,
      left,
      width: menuWidth,
      placement,
    };
  }
  return {
    bottom: window.innerHeight - rect.top + gap,
    left,
    width: menuWidth,
    placement,
  };
}

export function DateField({
  id,
  name,
  value: controlledValue,
  defaultValue = "",
  size = "md",
  full = false,
  disabled = false,
  required = false,
  placeholder = "Select date",
  className = "",
  onChange,
}: DateFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlledValue ?? uncontrolled;
  const selected = parseDateOnly(value);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selected ?? today),
  );

  function setValue(next: string) {
    if (controlledValue === undefined) setUncontrolled(next);
    onChange?.(next);
  }

  function closeMenu() {
    setOpen(false);
    setCoords(null);
  }

  function updatePosition() {
    const field = fieldRef.current;
    if (!field) return;
    setCoords(measureCoords(field));
  }

  function openMenu() {
    if (disabled || open) return;
    const field = fieldRef.current;
    setViewMonth(startOfMonth(selected ?? today));
    if (field) setCoords(measureCoords(field));
    setOpen(true);
  }

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, viewMonth]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        fieldRef.current?.focus();
      }
    }

    function onReposition() {
      updatePosition();
    }

    // Defer so the opening pointer/click cannot immediately close the menu.
    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown, true);
    }, 0);

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  function choose(date: Date) {
    setValue(toDateOnly(date));
    closeMenu();
    fieldRef.current?.focus();
  }

  const cells = buildMonthCells(viewMonth);
  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const display = formatDisplay(value);

  const menuStyle: CSSProperties | undefined = coords
    ? {
        position: "fixed",
        top: coords.top,
        bottom: coords.bottom,
        left: coords.left,
        width: coords.width,
        zIndex: 80,
      }
    : {
        position: "fixed",
        top: 0,
        left: 0,
        width: 288,
        zIndex: 80,
        visibility: "hidden",
      };

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            role="dialog"
            aria-label="Choose date"
            className="overflow-hidden rounded-input border border-card-border bg-card p-3 shadow-card"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label="Previous month"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-background"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setViewMonth((month) => addMonths(month, -1))}
              >
                <CaretLeftIcon size={16} weight="bold" aria-hidden />
              </button>
              <p className="font-display text-sm font-semibold text-ink">
                {monthLabel}
              </p>
              <button
                type="button"
                aria-label="Next month"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-background"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setViewMonth((month) => addMonths(month, 1))}
              >
                <CaretRightIcon size={16} weight="bold" aria-hidden />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((label) => (
                <div
                  key={label}
                  className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="size-9" />;
                }
                const isSelected = selected ? sameDay(date, selected) : false;
                const isToday = sameDay(date, today);
                return (
                  <button
                    key={toDateOnly(date)}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(date)}
                    className={[
                      "inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-xs font-medium transition-colors focus:outline-none",
                      isSelected
                        ? "bg-primary text-on-primary"
                        : isToday
                          ? "bg-collab text-ink hover:bg-primary hover:text-on-primary"
                          : "text-ink hover:bg-background",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-card-border pt-2">
              <button
                type="button"
                className="cursor-pointer rounded-full px-2.5 py-1.5 text-xs font-display font-semibold text-muted transition-colors hover:bg-background hover:text-ink"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setValue("");
                  closeMenu();
                  fieldRef.current?.focus();
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-full bg-primary px-3 py-1.5 text-xs font-display font-semibold text-on-primary transition-colors hover:bg-primary-hover"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(today)}
              >
                Today
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={full ? "w-full" : ""}>
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}
      <button
        ref={fieldRef}
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerDown={(event) => {
          // Open on pointerdown (same as Select) so the menu appears reliably
          // inside <details>/label forms. stopPropagation keeps parent handlers away.
          event.stopPropagation();
          if (disabled || event.button !== 0) return;
          if (open) closeMenu();
          else openMenu();
        }}
        onClick={(event) => {
          // Click already handled in pointerdown; prevent double-toggle / form quirks.
          event.preventDefault();
          event.stopPropagation();
        }}
        className={[
          "inline-flex min-w-0 items-center gap-2 rounded-input border border-border bg-card text-left text-ink transition-colors",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-primary/40",
          controlSizes[size],
          fieldText[size],
          full ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span
          className={[
            "min-w-0 flex-1 truncate",
            display ? "text-ink" : "text-placeholder",
          ].join(" ")}
        >
          {display || placeholder}
        </span>
        <CalendarBlankIcon
          size={16}
          weight="regular"
          aria-hidden
          className="shrink-0 text-muted"
        />
      </button>
      {menu}
    </div>
  );
}
