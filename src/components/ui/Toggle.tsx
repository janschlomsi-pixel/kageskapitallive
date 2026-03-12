import { cn } from "@/utils/cn";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={cn("inline-flex items-center gap-3 cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed")}>
      <div
        className={cn(
          "relative w-12 h-7 rounded-full transition-all duration-300",
          checked ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30" : "bg-gray-200"
        )}
        onClick={() => !disabled && onChange(!checked)}
      >
        <div
          className={cn(
            "absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300",
            checked && "translate-x-5"
          )}
        />
      </div>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
    </label>
  );
}
