import React from "react";
import { ChevronDown, ChevronUp, LucideIcon } from "lucide-react";

interface CollapsiblePanelProps {
  title: string;
  icon: LucideIcon;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function CollapsiblePanel({
  title,
  icon: PanelIcon,
  isOpen,
  onToggle,
  children,
}: CollapsiblePanelProps) {
  return (
    <div className="rounded-lg bg-white shadow">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <PanelIcon className="h-5 w-5" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      <div
        className={`px-6 overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? "pb-6 max-h-[1000px]" : "max-h-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
