"use client";

import { useState } from "react";
import { signOut } from "@/actions/auth";
import { ThemeToggle } from "@/components/shared";
import {
  LogOut,
  User,
  Menu,
  Settings,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";

type HeaderProps = {
  user: {
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
};

export function Header({ user }: HeaderProps) {
  const { open } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="h-16 border-b bg-card flex items-center px-4 lg:px-6">
      {/* Left side - Mobile menu button */}
      <button
        onClick={open}
        className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Spacer to push right side to the right */}
      <div className="flex-1" />

      {/* Right side - User menu */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || user.email}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-card border shadow-lg z-50">
                <div className="p-2">
                  <a
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Configuración
                  </a>
                  <div className="border-t mt-2 pt-2">
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors w-full text-left text-red-600 dark:text-red-400"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
