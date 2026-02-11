"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePlanAccess } from "@/hooks/use-plan";
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
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPlan?: Plan;
  badge?: string;
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
    label: "Categorías",
    href: "/categories",
    icon: Tags,
  },
  {
    label: "Suscripciones",
    href: "/subscriptions",
    icon: CreditCard,
  },
  {
    label: "Workspaces",
    href: "/workspaces",
    icon: Building2,
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
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { canAccess, isLoading, plan } = usePlanAccess();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header con Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">K</span>
            </div>
            <span className="font-semibold text-lg">Konto</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="mx-auto">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">K</span>
            </div>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-1.5 rounded-md hover:bg-muted transition-colors",
            isCollapsed && "absolute left-4 top-14"
          )}
          aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Plan Badge */}
      {!isCollapsed && !isLoading && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Plan actual:</span>
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                plan === "STARTER" && "bg-muted text-muted-foreground",
                plan === "PRO" && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                plan === "BUSINESS" && "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
              )}
            >
              {plan}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const hasAccess = !item.requiredPlan || canAccess(item.requiredPlan);
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={hasAccess ? item.href : "#"}
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
                  href={item.href}
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
