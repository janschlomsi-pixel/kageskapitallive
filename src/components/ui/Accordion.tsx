import { cn } from "@/utils/cn";
import { useState, type ReactNode } from "react";

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Accordion({ title, children, defaultOpen = false, className }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50/50 transition-all duration-300"
      >
        <span className="font-bold text-gray-900">{title}</span>
        <div className={cn(
          "w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-all duration-300",
          isOpen && "bg-emerald-100 rotate-180"
        )}>
          <svg
            className={cn("w-4 h-4 transition-colors", isOpen ? "text-emerald-600" : "text-gray-500")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-6 pb-6 border-t border-gray-100">{children}</div>
      </div>
    </div>
  );
}
