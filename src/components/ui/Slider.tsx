import { cn } from "@/utils/cn";
import type { InputHTMLAttributes } from "react";

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  valueLabel?: string;
}

export function Slider({ label, valueLabel, className, ...props }: SliderProps) {
  return (
    <div className="w-full">
      {(label || valueLabel) && (
        <div className="flex justify-between items-center mb-3">
          {label && <span className="text-sm font-semibold text-gray-700">{label}</span>}
          {valueLabel && (
            <span className="text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {valueLabel}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        {...props}
        className={cn(
          "w-full h-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full appearance-none cursor-pointer",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
          "[&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-emerald-500 [&::-webkit-slider-thumb]:to-teal-500",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/30",
          "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110",
          className
        )}
      />
    </div>
  );
}
