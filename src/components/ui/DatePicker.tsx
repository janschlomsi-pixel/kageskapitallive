import { useState, useEffect, useRef } from "react";
import { format, addMonths, subMonths, isSameDay, isSameMonth, setYear, setMonth } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface DatePickerProps {
  label?: string;
  value: Date | undefined;
  onChange: (date: Date) => void;
  className?: string;
}

export function DatePicker({ label, value, onChange, className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [view, setView] = useState<"days" | "months" | "years">("days");

  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside the container (input)
      if (containerRef.current && containerRef.current.contains(event.target as Node)) {
        return;
      }

      // Check if click is inside the portal content
      const portal = document.getElementById(`datepicker-portal-${label || "default"}`);
      if (portal && portal.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [label]);

  const daysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    // 0 = Sunday, 1 = Monday. We want 0 = Monday, 6 = Sunday
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;

    return { days, firstDay: firstDayAdjusted };
  };

  const { days, firstDay } = daysInMonth(currentMonth);
  const daysArray = Array.from({ length: days }, (_, i) => i + 1);
  const empties = Array.from({ length: firstDay }, (_, i) => i);

  const months = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  const years = Array.from({ length: 100 }, (_, i) => currentMonth.getFullYear() - 50 + i);

  const toggleCalendar = () => {
    if (!isOpen) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
      setCurrentMonth(value || new Date());
      setView("days");
    }
    setIsOpen(!isOpen);
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onChange(newDate);
    setIsOpen(false);
  };

  const portalId = `datepicker-portal-${label || "default"}`;

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={toggleCalendar}
        className={cn(
          "w-full px-4 py-3 rounded-xl border border-gray-200 text-left text-sm bg-gray-50/50 flex items-center justify-between",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white",
          "transition-all duration-300",
          !value && "text-gray-400",
          className
        )}
      >
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {value ? format(value, "dd.MM.yyyy", { locale: de }) : "Datum wählen"}
        </span>
        <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && position && createPortal(
        <div
          id={portalId}
          className="absolute z-[9999] mt-2 bg-white rounded-2xl border border-gray-100 shadow-premium-lg p-4 animate-scale-in"
          style={{
            top: position.top,
            left: position.left,
            width: Math.max(320, position.width), // Min width 320px
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                if (view === "days") setCurrentMonth(subMonths(currentMonth, 1));
                else if (view === "months") setCurrentMonth(setYear(currentMonth, currentMonth.getFullYear() - 1));
                else if (view === "years") setCurrentMonth(setYear(currentMonth, currentMonth.getFullYear() - 10));
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (view === "days") setView("months");
                else if (view === "months") setView("years");
              }}
              className="text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors"
            >
              {view === "days" && format(currentMonth, "MMMM yyyy", { locale: de })}
              {view === "months" && format(currentMonth, "yyyy", { locale: de })}
              {view === "years" && `${years[0]} - ${years[years.length - 1]}`}
            </button>
            <button
              onClick={() => {
                if (view === "days") setCurrentMonth(addMonths(currentMonth, 1));
                else if (view === "months") setCurrentMonth(setYear(currentMonth, currentMonth.getFullYear() + 1));
                else if (view === "years") setCurrentMonth(setYear(currentMonth, currentMonth.getFullYear() + 10));
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Days View */}
          {view === "days" && (
            <>
              <div className="grid grid-cols-7 mb-2">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                  <div key={day} className="text-xs font-semibold text-gray-400 text-center py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {empties.map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {daysArray.map((day) => {
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const isSelected = value && isSameDay(date, value);
                  const isToday = isSameDay(date, new Date());

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200 mx-auto",
                        isSelected
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : isToday
                            ? "bg-emerald-50 text-emerald-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Months View */}
          {view === "months" && (
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, i) => (
                <button
                  key={month}
                  onClick={() => {
                    setCurrentMonth(setMonth(currentMonth, i));
                    setView("days");
                  }}
                  className={cn(
                    "p-2 rounded-lg text-sm transition-all duration-200",
                    isSameMonth(new Date(currentMonth.getFullYear(), i, 1), value || new Date())
                      ? "bg-emerald-500 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {month}
                </button>
              ))}
            </div>
          )}

          {/* Years View */}
          {view === "years" && (
            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    setCurrentMonth(setYear(currentMonth, year));
                    setView("months");
                  }}
                  className={cn(
                    "p-2 rounded-lg text-sm transition-all duration-200",
                    currentMonth.getFullYear() === year
                      ? "bg-emerald-500 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
