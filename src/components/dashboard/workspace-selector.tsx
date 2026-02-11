"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
import { Home, Building2, ChevronDown, Check } from "lucide-react";

type WorkspaceSelectorProps = {
  isCollapsed?: boolean;
};

export function WorkspaceSelector({ isCollapsed = false }: WorkspaceSelectorProps) {
  const { workspaces, activeWorkspace, switchWorkspace, isLoading, error } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        "border-b",
        isCollapsed ? "px-2 py-3" : "px-4 py-3"
      )}>
        <div className={cn(
          "animate-pulse bg-muted rounded-md",
          isCollapsed ? "h-8 w-8 mx-auto" : "h-9 w-full"
        )} />
      </div>
    );
  }

  // Error state
  if (error) {
    console.error("WorkspaceSelector error:", error.message, error);
    return (
      <div className={cn(
        "border-b text-xs text-red-500",
        isCollapsed ? "px-2 py-3" : "px-4 py-3"
      )}>
        {!isCollapsed && `Error: ${error.message}`}
      </div>
    );
  }

  // No workspaces
  if (!activeWorkspace || workspaces.length === 0) {
    return null;
  }

  const WorkspaceIcon = activeWorkspace.type === "PERSONAL" ? Home : Building2;

  return (
    <div className={cn("border-b", isCollapsed ? "px-2 py-3" : "px-3 py-3")} ref={dropdownRef}>
      <div className="relative">
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 w-full rounded-md transition-colors",
            "hover:bg-muted",
            isCollapsed ? "justify-center p-2" : "px-3 py-2"
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <WorkspaceIcon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left text-sm font-medium truncate">
                {activeWorkspace.name}
              </span>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className={cn(
            "absolute z-50 mt-1 bg-card border rounded-md shadow-lg py-1",
            "min-w-[200px]",
            isCollapsed ? "left-full ml-2 top-0" : "left-0 right-0"
          )}>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Cambiar workspace
            </div>
            {workspaces.map((workspace) => {
              const Icon = workspace.type === "PERSONAL" ? Home : Building2;
              const isActive = workspace.id === activeWorkspace.id;

              return (
                <button
                  key={workspace.id}
                  onClick={() => {
                    switchWorkspace(workspace.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 text-sm transition-colors",
                    "hover:bg-muted",
                    isActive && "bg-muted"
                  )}
                  role="option"
                  aria-selected={isActive}
                >
                  <span className="w-4 flex justify-center">
                    {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                  </span>
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-left truncate">{workspace.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {workspace.currency}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
