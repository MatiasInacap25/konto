"use client";

import { useState } from "react";
import { signOut } from "@/actions/auth";
import { ThemeToggle } from "@/components/shared";
import {
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";

type HeaderProps = {
  user: {
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
};

export function Header({ user }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      {/* Left side - Breadcrumb o título podría ir acá */}
      <div>
        {/* Espacio para breadcrumbs o search */}
      </div>

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
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-none">
                {user.name || "Usuario"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user.email}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-md bg-card border shadow-lg z-50">
                <div className="p-2">
                  <div className="px-3 py-2 border-b mb-2">
                    <p className="text-sm font-medium">{user.name || "Usuario"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <a
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Mi perfil
                  </a>
                  <a
                    href="/settings/billing"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    Plan y facturación
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
