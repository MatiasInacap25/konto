"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Konto Toast System
 * 
 * Signature: Borde izquierdo coloreado (consistente con transacciones/cuentas)
 * - Success: borde teal (primary)
 * - Error: borde destructive
 * - Warning: borde amber
 * - Info: borde muted
 * 
 * Surface: Card color (grafito en dark, blanco en light)
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-primary" />,
        info: <InfoIcon className="size-4 text-muted-foreground" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
        loading: <Loader2Icon className="size-4 animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        className: "konto-toast",
        classNames: {
          toast: "!bg-card !border-border/60 !shadow-lg relative before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full before:bg-border",
          title: "!text-foreground !font-medium",
          description: "!text-muted-foreground",
          success: "before:!bg-primary",
          error: "before:!bg-destructive",
          warning: "before:!bg-amber-500",
          info: "before:!bg-muted-foreground/50",
          closeButton: "!bg-card !border-border/60 !text-muted-foreground hover:!bg-accent hover:!text-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
