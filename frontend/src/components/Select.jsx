import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Select({
  options = [],
  value = "",
  onChange,
  placeholder = "Select…",
  className = "",
  disabled = false,
  name,
  maxVisible = 4,
}) {
  const buttonRef = useRef(null);
  const listboxRef = useRef(null);
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();

  const normalized = useMemo(
    () =>
      options.map((option) =>
        typeof option === "string"
          ? { value: option, label: option }
          : option
      ),
    [options]
  );

  const selectedIndex = useMemo(
    () => normalized.findIndex((opt) => opt.value === value),
    [normalized, value]
  );

  useEffect(() => {
    if (open) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else {
      setActiveIndex(-1);
    }
  }, [open, selectedIndex]);

  useEffect(() => {
    function handleClickAway(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickAway);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickAway);
    };
  }, [open]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  function commitSelection(next) {
    if (onChange) onChange(next);
    setOpen(false);
    setActiveIndex(-1);
    buttonRef.current?.focus();
  }

  function handleOptionClick(opt) {
    commitSelection(opt.value);
  }

  function handleKeyDown(event) {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((prev) => {
        if (normalized.length === 0) return -1;
        const delta = event.key === "ArrowDown" ? 1 : -1;
        const next = prev < 0 ? (delta > 0 ? 0 : normalized.length - 1) : prev + delta;
        if (next < 0) return normalized.length - 1;
        if (next >= normalized.length) return 0;
        return next;
      });
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      } else if (activeIndex >= 0 && normalized[activeIndex]) {
        commitSelection(normalized[activeIndex].value);
        setOpen(false);
      }
    }
  }

  useEffect(() => {
    if (!open || activeIndex < 0 || !listboxRef.current) return;
    const node = listboxRef.current.querySelector(
      `[data-index="${activeIndex}"]`
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const displayLabel =
    selectedIndex >= 0 ? normalized[selectedIndex].label : placeholder;
  const isPlaceholder = selectedIndex < 0;

  useEffect(() => {
    setOpen(false);
  }, [value]);

  const baseButtonClasses =
    "w-full rounded-lg border px-3 py-2 text-sm flex items-center justify-between gap-2 transition";
  const stateClasses = disabled
    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
    : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {name ? (
        <input type="hidden" name={name} value={value ?? ""} readOnly />
      ) : null}
      <button
        type="button"
        className={`${baseButtonClasses} ${stateClasses}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        ref={buttonRef}
        disabled={disabled}
      >
        <span
          className={`flex-1 text-left ${
            isPlaceholder ? "text-slate-400" : "text-slate-900"
          }`}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            open ? "translate-y-px rotate-180" : ""
          } ${disabled ? "text-slate-300" : "text-slate-400"}`}
        />
      </button>
      {open && normalized.length > 0 ? (
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
          }
          tabIndex={-1}
          className="absolute z-30 mt-2 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl focus:outline-none"
          style={{ maxHeight: `${Math.max(4, maxVisible) * 44}px` }}
        >
          <ul className="py-1">
            {normalized.map((opt, index) => {
              const active = index === activeIndex;
              const selected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={selected}
                  data-index={index}
                  className={`flex cursor-pointer items-center px-3 py-2 text-sm ${
                    active
                      ? "bg-slate-100 text-slate-900"
                      : selected
                      ? "bg-slate-50 text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(selectedIndex)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleOptionClick(opt);
                  }}
                  onClick={(event) => {
                    if (event.detail === 0) {
                      handleOptionClick(opt);
                    }
                  }}
                >
                  {opt.label}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
