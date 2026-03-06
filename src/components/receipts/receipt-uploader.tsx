"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ReceiptUploaderProps = {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
};

export function ReceiptUploader({ onUpload, disabled }: ReceiptUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        await onUpload(file);
      } finally {
        setIsUploading(false);
        // Reset input so the same file can be re-selected
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile, disabled, isUploading]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !isUploading) {
        setIsDragging(true);
      }
    },
    [disabled, isUploading]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
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
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  }, [disabled, isUploading]);

  return (
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
        "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50",
        (disabled || isUploading) && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="sr-only"
        disabled={disabled || isUploading}
      />

      {isUploading ? (
        <>
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">
            Subiendo recibo...
          </p>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            {isDragging ? (
              <Upload className="w-6 h-6 text-primary" />
            ) : (
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
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
  );
}
