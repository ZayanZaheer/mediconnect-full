import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import Select from "./Select.jsx";

function parseDate(value) {
  if (!value) return null;

  // Accept YYYY-MM-DD, ISO strings with time, or Date objects.
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const str = String(value).trim();
  if (!str) return null;

  // Take just the date portion before any time/zone.
  const datePart = str.split(/[ T]/)[0];
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function DatePicker({
  value = "",
  onChange,
  placeholder = "Select date",
  className = "",
  disabled = false,
  name,
}) {
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    minWidth: 0,
  });

  const today = useMemo(() => new Date(), []);
  const selectedDate = useMemo(() => parseDate(value), [value]);

  const [viewYear, setViewYear] = useState(
    selectedDate?.getFullYear() ?? today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate?.getMonth() ?? today.getMonth()
  );

  useEffect(() => {
    if (!open) return;
    const year = selectedDate?.getFullYear() ?? today.getFullYear();
    const month = selectedDate?.getMonth() ?? today.getMonth();
    setViewYear(year);
    setViewMonth(month);
  }, [open, selectedDate, today]);

  const grid = useMemo(() => {
    const start = new Date(viewYear, viewMonth, 1);
    const startOffset = start.getDay();
    const gridStart = new Date(viewYear, viewMonth, 1 - startOffset);

    const days = Array.from({ length: 42 }).map((_, idx) => {
      const date = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + idx
      );
      return {
        date,
        inCurrentMonth: date.getMonth() === viewMonth,
        isToday: isSameDay(date, today),
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      };
    });

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [viewYear, viewMonth, selectedDate, today]);

  const updatePosition = useCallback(() => {
    if (
      !open ||
      typeof window === "undefined" ||
      !triggerRef.current ||
      !popoverRef.current
    ) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popRect = popoverRef.current.getBoundingClientRect();
    const margin = 8;

    let top = triggerRect.bottom + margin;
    if (top + popRect.height > window.innerHeight - margin) {
      top = triggerRect.top - margin - popRect.height;
      if (top < margin) top = Math.max(margin, window.innerHeight - popRect.height - margin);
    }

    let left = triggerRect.left;
    if (left + popRect.width > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - popRect.width - margin);
    }
    if (left < margin) left = margin;

    const width = Math.min(Math.max(triggerRect.width, 240), 320);

    setPosition({
      top,
      left,
      width,
    });
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition, viewMonth, viewYear]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    function handleResize() {
      updatePosition();
    }
    function handleScroll() {
      updatePosition();
    }
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    function handleClickAway(event) {
      if (
        open &&
        triggerRef.current &&
        popoverRef.current &&
        !triggerRef.current.contains(event.target) &&
        !popoverRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickAway);
    }
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [open]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  function commit(nextValue) {
    onChange?.(nextValue);
  }

  function handleSelect(date) {
    commit(formatDate(date));
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleToggle() {
    if (disabled) return;
    setOpen((prev) => !prev);
  }

  const yearOptions = useMemo(() => {
    const currentYear = today.getFullYear();
    const startYear = currentYear - 120;
    const endYear = currentYear + 10;
    const list = [];
    for (let year = endYear; year >= startYear; year -= 1) {
      list.push(year);
    }
    return list;
  }, [today]);

  function handleMonthJump(event) {
    const nextMonth = Number(event.target.value);
    if (Number.isNaN(nextMonth)) return;
    setViewMonth(nextMonth);
  }

  function handleYearJump(event) {
    const nextYear = Number(event.target.value);
    if (Number.isNaN(nextYear)) return;
    setViewYear(nextYear);
  }

  function goToPreviousMonth() {
    const next = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function goToNextMonth() {
    const next = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
      }),
    []
  );

  const displayLabel = selectedDate
    ? monthFormatter.format(selectedDate) === "Invalid Date"
      ? formatDate(selectedDate)
      : new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(selectedDate)
    : placeholder;

  const displayIsPlaceholder = !selectedDate;
  const listboxId = useId();

  return (
    <div className={className}>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
      <button
        type="button"
        ref={triggerRef}
        onClick={handleToggle}
        disabled={disabled}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm transition hover:border-slate-300 focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1 ${
          disabled ? "cursor-not-allowed text-slate-400" : "text-slate-700"
        }`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
      >
        <span
          className={`flex items-center gap-2 ${
            displayIsPlaceholder ? "text-slate-400" : "text-slate-900"
          }`}
        >
          <Calendar className="h-4 w-4 text-slate-400" />
          {displayLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div
          ref={popoverRef}
          id={listboxId}
          role="dialog"
          aria-label="Choose date"
          className="fixed z-50 rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
          }}
        >
          <div
            className="flex items-center justify-between gap-2 px-3 py-2"
            onMouseDown={(e) => e.stopPropagation()} // keep picker open when interacting with selects/buttons
          >
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Select
                value={String(viewMonth)}
                onChange={(next) => handleMonthJump({ target: { value: next } })}
                options={MONTH_NAMES.map((label, idx) => ({
                  value: String(idx),
                  label,
                }))}
                className="w-28 [&>button]:px-2 [&>button]:py-1 [&>button]:rounded-lg [&>button]:text-xs"
                maxVisible={6}
              />
              <Select
                value={String(viewYear)}
                onChange={(next) => handleYearJump({ target: { value: next } })}
                options={yearOptions.map((year) => ({
                  value: String(year),
                  label: String(year),
                }))}
                className="w-24 [&>button]:px-2 [&>button]:py-1 [&>button]:rounded-lg [&>button]:text-xs"
                maxVisible={6}
              />
            </div>
            <button
              type="button"
              onClick={goToNextMonth}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 px-3 pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 px-3 pb-3">
            {grid.flat().map(({ date, inCurrentMonth, isToday, isSelected }) => (
              <button
                key={formatDate(date)}
                type="button"
                onClick={() => handleSelect(date)}
                className={`aspect-square rounded-lg text-sm transition ${
                  inCurrentMonth
                    ? "text-slate-700 hover:bg-slate-100"
                    : "text-slate-300 hover:text-slate-500"
                } ${
                  isSelected
                    ? "bg-primary-600 text-white hover:bg-primary-600"
                    : ""
                } ${isToday && !isSelected ? "ring-1 ring-primary-200" : ""}`}
              >
                {date.getDate()}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2">
            <button
              type="button"
              onClick={() => {
                commit("");
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleSelect(today)}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
