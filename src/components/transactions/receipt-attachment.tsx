"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, ImagePlus, Loader2, FileText, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { attachReceiptToTransaction } from "@/actions/receipts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ReceiptAttachmentProps = {
  transactionId: string;
  workspaceId: string;
  currentReceiptUrl?: string | null;
  currency: string;
};

export function ReceiptAttachment({
  transactionId,
  workspaceId,
  currentReceiptUrl,
}: ReceiptAttachmentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("transactionId", transactionId);
        formData.append("workspaceId", workspaceId);

        const result = await attachReceiptToTransaction(formData);

        if (result.success) {
          toast.success("Comprobante adjuntado");
          // Refresh the page to show the new receipt
          window.location.reload();
        } else {
          toast.error(result.error || "Error al adjuntar comprobante");
        }
      } catch {
        toast.error("Error inesperado");
      } finally {
        setIsUploading(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [transactionId, workspaceId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile, isUploading]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading) {
      setIsDragging(true);
    }
  }, [isUploading]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    if (!isUploading) {
      inputRef.current?.click();
    }
  }, [isUploading]);

  // If there's already a receipt, show it
  if (currentReceiptUrl) {
    return (
      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          Comprobante / Facturación
        </label>
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Comprobante adjuntado</p>
            <p className="text-xs text-muted-foreground truncate">
              {currentReceiptUrl}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a
              href={currentReceiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // No receipt - show upload area
  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <FileText className="h-3.5 w-3.5" />
        Comprobante / Facturación
      </label>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="sr-only"
          disabled={isUploading}
        />

        {isUploading ? (
          <>
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">
              Subiendo comprobante...
            </p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              {isDragging ? (
                <Upload className="w-5 h-5 text-primary" />
              ) : (
                <ImagePlus className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragging
                  ? "Soltá la imagen acá"
                  : "Arrastrá una imagen o hacé clic para subir"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG o WebP — Máximo 5MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
