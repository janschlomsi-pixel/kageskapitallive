import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className, title, subtitle, hover = false, padding = "md" }: CardProps) {
  const paddingClasses = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-100 shadow-premium",
        paddingClasses[padding],
        hover && "card-hover hover:shadow-premium-hover",
        className
      )}
    >
      {(title || subtitle) && (
        <div className="mb-5">
          {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
