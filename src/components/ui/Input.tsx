import { cn } from "@/utils/cn";
import { type InputHTMLAttributes, useState, useEffect, useRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suffix?: string;
  error?: string;
}

export function Input({ label, suffix, error, className, value, onChange, onBlur, ...props }: InputProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const localValueRef = useRef(localValue);

  // Keep ref in sync
  useEffect(() => {
    localValueRef.current = localValue;
  }, [localValue]);

  // Sync local value with prop value when it changes externally
  useEffect(() => {
    // Prevent "0" snapback if user edits and field is empty
    if (Number(value) === 0 && localValueRef.current === "" && document.activeElement === inputRef.current) {
      return;
    }
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    onChange?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setLocalValue(value);
    onBlur?.(e);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          ref={inputRef}
          value={localValue ?? ""}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50/50",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white",
            "placeholder:text-gray-400 transition-all duration-300",
            suffix && "pr-12",
            error && "border-red-400 focus:ring-red-200 focus:border-red-400",
            className
          )}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
