"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { CaretDownIcon } from "@phosphor-icons/react";
import { controlSizes, fieldText, type ControlSize } from "@/lib/control";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  id?: string;
  name?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  size?: ControlSize;
  full?: boolean;
  className?: string;
  onChange?: (value: string) => void;
};

type MenuCoords = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "below" | "above";
};

export function Select({
  id,
  name,
  options,
  value: controlledValue,
  defaultValue,
  placeholder = "Select…",
  size = "md",
  full = false,
  className = "",
  onChange,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listId = `${selectId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const value = controlledValue ?? uncontrolled;
  const selected = options.find((option) => option.value === value);

  function setValue(next: string) {
    if (controlledValue === undefined) setUncontrolled(next);
    onChange?.(next);
  }

  function updatePosition() {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const gap = 6;
    const estimatedHeight = Math.min(options.length * 44 + 8, 240);
    const measured = listRef.current?.offsetHeight;
    const menuHeight = measured && measured > 0 ? measured : estimatedHeight;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const placement: MenuCoords["placement"] =
      spaceBelow < menuHeight && spaceAbove > spaceBelow ? "above" : "below";
    const maxHeight =
      placement === "below"
        ? Math.min(240, Math.max(80, spaceBelow))
        : Math.min(240, Math.max(80, spaceAbove));

    if (placement === "below") {
      setCoords({
        top: rect.bottom + gap,
        left: rect.left,
        width: rect.width,
        maxHeight,
        placement,
      });
    } else {
      setCoords({
        bottom: window.innerHeight - rect.top + gap,
        left: rect.left,
        width: rect.width,
        maxHeight,
        placement,
      });
    }
  }

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onReposition() {
      updatePosition();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, options.length]);

  function onButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      setOpen(true);
    }
  }

  const menuStyle: CSSProperties | undefined = coords
    ? {
        position: "fixed",
        top: coords.top,
        bottom: coords.bottom,
        left: coords.left,
        width: coords.width,
        maxHeight: coords.maxHeight,
        zIndex: 80,
      }
    : undefined;

  const menu =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={selectId}
            style={menuStyle}
            className="overflow-auto rounded-input border border-card-border bg-card py-1 shadow-card"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    className={[
                      "flex w-full items-center px-3.5 py-2.5 text-left transition-colors focus:outline-none",
                      fieldText[size],
                      isSelected
                        ? "bg-background font-medium text-ink"
                        : "text-ink hover:bg-background",
                    ].join(" ")}
                    onClick={() => {
                      setValue(option.value);
                      setOpen(false);
                      buttonRef.current?.focus();
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={full ? "w-full" : ""}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={buttonRef}
        id={selectId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onButtonKeyDown}
        className={[
          "inline-flex min-w-0 items-center justify-between gap-2 rounded-input border border-border bg-card text-left text-ink focus:outline-none",
          controlSizes[size],
          fieldText[size],
          full ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span
          className={
            selected ? "truncate text-ink" : "truncate text-placeholder"
          }
        >
          {selected?.label ?? placeholder}
        </span>
        <CaretDownIcon
          size={16}
          weight="bold"
          aria-hidden
          className={`shrink-0 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {menu}
    </div>
  );
}
