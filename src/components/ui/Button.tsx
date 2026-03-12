import { cn } from "@/utils/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] focus:ring-emerald-500/50":
            variant === "primary",
          "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] focus:ring-blue-500/50":
            variant === "secondary",
          "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300":
            variant === "ghost",
          "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-lg hover:shadow-red-500/30 hover:scale-[1.02] focus:ring-red-400":
            variant === "danger",
        },
        {
          "px-3 py-2 text-xs": size === "sm",
          "px-5 py-2.5 text-sm": size === "md",
          "px-8 py-4 text-base": size === "lg",
        },
        className
      )}
    >
      {children}
    </button>
  );
}
