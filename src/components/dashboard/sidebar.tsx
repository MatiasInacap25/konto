"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePlanAccess } from "@/hooks/use-plan";
import { WorkspaceSelector } from "./workspace-selector";
import type { Plan } from "@/types/plans";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  CreditCard,
  Building2,
  Calculator,
  TrendingUp,
  Receipt,
  MessageCircle,
  Settings,
  Lock,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPlan?: Plan;
  badge?: string;
  /** Si true, no incluye el workspace en la URL */
  noWorkspace?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transacciones",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Cuentas",
    href: "/accounts",
    icon: Wallet,
  },
  {
    label: "Reportes",
    href: "/reports",
    icon: BarChart3,
  },
  {
    label: "Categorías",
    href: "/categories",
    icon: Tags,
  },
  {
    label: "Recurrentes",
    href: "/recurrings",
    icon: CreditCard,
  },
  {
    label: "Workspaces",
    href: "/workspaces",
    icon: Building2,
    noWorkspace: true,
  },
  {
    label: "Reglas de Impuestos",
    href: "/tax-rules",
    icon: Calculator,
  },
  {
    label: "Proyección (Runway)",
    href: "/runway",
    icon: TrendingUp,
    requiredPlan: "PRO",
  },
  {
    label: "Recibos",
    href: "/receipts",
    icon: Receipt,
    requiredPlan: "PRO",
  },
  {
    label: "Bot WhatsApp",
    href: "/whatsapp-bot",
    icon: MessageCircle,
    requiredPlan: "BUSINESS",
    badge: "IA",
  },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    label: "Configuración",
    href: "/settings",
    icon: Settings,
    noWorkspace: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { canAccess } = usePlanAccess();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Obtener el workspace actual de la URL para mantenerlo en los links
  const currentWorkspaceId = searchParams.get("workspace");

  // Función para generar href con workspace param
  function getHref(item: NavItem): string {
    if (item.noWorkspace || !currentWorkspaceId) {
      return item.href;
    }
    return `${item.href}?workspace=${currentWorkspaceId}`;
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header con Logo */}
      <div className={cn(
        "flex items-center h-16 border-b",
        isCollapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        <Link href="/dashboard" className="flex items-center">
          <div className="h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0 px-2">
            <span className="text-primary-foreground font-bold text-sm">
              {isCollapsed ? "K" : "Konto"}
            </span>
          </div>
        </Link>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Colapsar sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Botón expandir - solo visible cuando está colapsado */}
      {isCollapsed && (
        <div className="flex justify-center py-2 border-b">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Expandir sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Workspace Selector */}
      <WorkspaceSelector isCollapsed={isCollapsed} />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const hasAccess = !item.requiredPlan || canAccess(item.requiredPlan);
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={hasAccess ? getHref(item) : "#"}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    !hasAccess && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={(e) => {
                    if (!hasAccess) {
                      e.preventDefault();
                    }
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {!hasAccess && <Lock className="w-3.5 h-3.5" />}
                      {item.badge && hasAccess && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t py-4 px-2">
        <ul className="space-y-1">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={getHref(item)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
