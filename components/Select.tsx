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
  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const skipOpenOnFocus = useRef(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const value = controlledValue ?? uncontrolled;
  const selected = options.find((option) => option.value === value);
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? options.filter(
        (option) =>
          option.label.toLowerCase().includes(needle) ||
          option.value.toLowerCase().includes(needle),
      )
    : options;
  const inputValue = open ? query : (selected?.label ?? "");

  function setValue(next: string) {
    if (controlledValue === undefined) setUncontrolled(next);
    onChange?.(next);
  }

  function updatePosition() {
    const field = fieldRef.current;
    if (!field) return;

    const rect = field.getBoundingClientRect();
    const gap = 6;
    const estimatedHeight = Math.min(Math.max(filtered.length, 1) * 44 + 8, 240);
    const measured = menuRef.current?.offsetHeight;
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
  }, [open, filtered.length]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
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
  }, [open, filtered.length]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [open, active, needle]);

  function openMenu() {
    if (open) return;
    const index = options.findIndex((option) => option.value === value);
    setActive(index >= 0 ? index : 0);
    setQuery("");
    setOpen(true);
  }

  function choose(next: string) {
    skipOpenOnFocus.current = true;
    setValue(next);
    setOpen(false);
    inputRef.current?.focus();
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) openMenu();
      if (filtered.length === 0) return;
      setActive((index) => Math.min(filtered.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return;
      if (filtered.length === 0) return;
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      if (!open) return;
      event.preventDefault();
      const option = filtered[active];
      if (option) choose(option.value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
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
          <div
            ref={menuRef}
            style={menuStyle}
            className="overflow-hidden rounded-input border border-card-border bg-card shadow-card"
          >
            {filtered.length === 0 ? (
              <p className="px-3.5 py-2.5 text-xs text-muted">No matches</p>
            ) : (
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-labelledby={selectId}
                style={{ maxHeight: coords.maxHeight }}
                className="overflow-auto py-1"
              >
                {filtered.map((option, index) => {
                  const isSelected = option.value === value;
                  const isActive = index === active;
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      data-index={index}
                    >
                      <button
                        type="button"
                        className={[
                          "flex w-full items-center px-3.5 py-2.5 text-left transition-colors focus:outline-none",
                          fieldText[size],
                          isActive || isSelected
                            ? "bg-background text-ink"
                            : "text-ink hover:bg-background",
                          isSelected ? "font-medium" : "",
                        ].join(" ")}
                        onMouseEnter={() => setActive(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => choose(option.value)}
                      >
                        {option.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={full ? "w-full" : ""}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <div
        ref={fieldRef}
        className={[
          "inline-flex min-w-0 items-center gap-2 rounded-input border border-border bg-card text-ink",
          controlSizes[size],
          fieldText[size],
          full ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          ref={inputRef}
          id={selectId}
          type="text"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          value={inputValue}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (skipOpenOnFocus.current) {
              skipOpenOnFocus.current = false;
              return;
            }
            openMenu();
          }}
          onKeyDown={onInputKeyDown}
          className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-placeholder"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Show options"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) setOpen(false);
            else {
              inputRef.current?.focus();
              openMenu();
            }
          }}
          className="shrink-0 text-muted"
        >
          <CaretDownIcon
            size={16}
            weight="bold"
            aria-hidden
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {menu}
    </div>
  );
}
