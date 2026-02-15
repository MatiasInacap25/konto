"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORY_ICONS, type CategoryIcon } from "@/lib/validations/category";

type IconPickerProps = {
  value: string | null;
  onChange: (icon: CategoryIcon | null) => void;
};

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedIcon = value as CategoryIcon | null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 rounded-md border bg-background",
          "hover:bg-accent transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring"
        )}
      >
        <span className="text-xl">{selectedIcon || "📋"}</span>
        <span className="text-sm text-muted-foreground">
          {selectedIcon ? "Cambiar ícono" : "Seleccionar ícono"}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-card border rounded-lg shadow-lg z-50 p-3">
            <div className="grid grid-cols-8 gap-1">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    onChange(icon);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-md text-lg",
                    "hover:bg-accent transition-colors",
                    value === icon && "bg-primary/10 ring-1 ring-primary"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
