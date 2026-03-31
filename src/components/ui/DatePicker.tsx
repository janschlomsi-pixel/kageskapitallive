import { useState, useEffect, useRef } from "react";
import { format, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface DatePickerProps {
  label?: string;
  value: Date | undefined;
  onChange: (date: Date) => void;
  className?: string;
}

const months = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function DatePicker({ label, value, onChange, className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());

  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const portalId = `datepicker-portal-${label || "default"}`;

  // Update position when open
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const calendarHeight = 340;
        const showAbove = spaceBelow < calendarHeight && rect.top > calendarHeight;

        setPosition({
          top: showAbove
            ? rect.top + window.scrollY - calendarHeight - 8
            : rect.bottom + window.scrollY + 4,
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

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && containerRef.current.contains(event.target as Node)) return;
      const portal = document.getElementById(portalId);
      if (portal && portal.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [portalId]);

  const toggleCalendar = () => {
    if (!isOpen) {
      setViewDate(value || new Date());
    }
    setIsOpen(!isOpen);
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(newDate);
    setIsOpen(false);
  };

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  // Calendar grid
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const years = Array.from({ length: 80 }, (_, i) => 1950 + i);

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
          className="absolute z-[9999] bg-white rounded-2xl border border-gray-100 shadow-xl p-4"
          style={{
            top: position.top,
            left: position.left,
            width: Math.max(300, Math.min(340, position.width)),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header mit Dropdowns */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-1">
              <select
                value={viewDate.getMonth()}
                onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1))}
                className="text-sm font-semibold text-gray-900 bg-transparent border-none focus:ring-0 cursor-pointer pr-1 appearance-none"
              >
                {months.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={viewDate.getFullYear()}
                onChange={(e) => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1))}
                className="text-sm font-semibold text-gray-900 bg-transparent border-none focus:ring-0 cursor-pointer appearance-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Wochentage */}
          <div className="grid grid-cols-7 mb-2">
            {weekdays.map((day) => (
              <div key={day} className="text-xs font-semibold text-gray-400 text-center py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Tage */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const isSelected = value && isSameDay(date, value);
              const isToday = isSameDay(date, new Date());

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-200 mx-auto",
                    isSelected
                      ? "bg-[#059669] text-white font-medium shadow-md shadow-[#059669]/20"
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
        </div>,
        document.body
      )}
    </div>
  );
}
