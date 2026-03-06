import Link from "next/link";
import { cn } from "@/lib/utils";

type KontoLogoProps = {
  collapsed?: boolean;
  href?: string;
};

export function KontoLogo({ collapsed = false, href = "/dashboard" }: KontoLogoProps) {
  return (
    <Link href={href} className="flex items-center gap-1.5">
      {/* Cuadrado con gradiente y "K" monospace */}
      <div
        className={cn(
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg",
          "bg-gradient-to-br from-primary to-primary/80",
          "ring-1 ring-primary/20"
        )}
      >
        <span className="font-mono text-sm font-bold text-primary-foreground">
          K
        </span>
      </div>

      {/* "onto" en monospace al lado */}
      {!collapsed && (
        <span className="font-mono text-base font-medium tracking-wide text-foreground">
          onto
        </span>
      )}
    </Link>
  );
}
