"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { CircleHelp, ScanLine, Zap } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ReceiptUploader } from "./receipt-uploader";
import { ReceiptList } from "./receipt-list";
import {
  uploadReceipt,
  processReceipt,
  confirmReceipt,
  retryReceipt,
  deleteReceipt,
} from "@/actions/receipts";
import { validateReceiptFile } from "@/lib/validations/receipt";
import type { ExtractedReceiptData } from "@/lib/validations/receipt";
import type { ReceiptItem } from "@/lib/queries/receipts";
import type { AccountOption, CategoryOption } from "@/types/transactions";

const AUTO_CREATE_KEY = "receipts-auto-create";

// Lazy-load the confirm form sheet
const ReceiptConfirmForm = dynamic(
  () =>
    import("./receipt-confirm-form").then((mod) => ({
      default: mod.ReceiptConfirmForm,
    })),
  { ssr: false, loading: () => null }
);

type ReceiptsClientProps = {
  receipts: ReceiptItem[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  workspaceId: string;
  workspaceType: "PERSONAL" | "BUSINESS";
  currency: string;
};

export function ReceiptsClient({
  receipts: initialReceipts,
  accounts,
  categories,
  workspaceId,
  workspaceType,
  currency,
}: ReceiptsClientProps) {
  const [confirmSheetOpen, setConfirmSheetOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptItem | null>(
    null
  );
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  // Auto-create toggle — persisted in localStorage (OFF by default)
  const [autoCreate, setAutoCreate] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTO_CREATE_KEY);
      if (stored === "true") setAutoCreate(true);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleAutoCreateChange = useCallback((checked: boolean) => {
    setAutoCreate(checked);
    try {
      localStorage.setItem(AUTO_CREATE_KEY, String(checked));
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Build auto-confirm data from extracted receipt data
  const tryAutoConfirm = useCallback(
    async (
      receiptId: string,
      extractedData: ExtractedReceiptData | null
    ): Promise<boolean> => {
      if (!extractedData?.amount || !accounts[0]) {
        return false;
      }

      // Match suggested category
      const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
      let matchedCategoryId = "";
      if (extractedData.suggestedCategory) {
        const match = expenseCategories.find(
          (c) =>
            c.name.toLowerCase() ===
            extractedData.suggestedCategory?.toLowerCase()
        );
        if (match) matchedCategoryId = match.id;
      }

      const confirmData = {
        receiptId,
        amount: String(extractedData.amount),
        description:
          extractedData.description || extractedData.merchant || "",
        date: extractedData.date
          ? new Date(extractedData.date)
          : new Date(),
        accountId: accounts[0].id,
        categoryId: matchedCategoryId,
        scope: (workspaceType === "PERSONAL" ? "PERSONAL" : "BUSINESS") as
          | "PERSONAL"
          | "BUSINESS"
          | "MIXED",
      };

      const result = await confirmReceipt(confirmData, workspaceId);
      return result.success;
    },
    [accounts, categories, workspaceId, workspaceType]
  );

  // Handle file upload
  const handleUpload = useCallback(
    async (file: File) => {
      // Client-side validation
      const validation = validateReceiptFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspaceId", workspaceId);

      const uploadResult = await uploadReceipt(formData);

      if (!uploadResult.success) {
        toast.error(uploadResult.error || "Error al subir el recibo");
        return;
      }

      toast.success("Recibo subido, analizando con IA...");

      // Process the receipt with AI
      startTransition(async () => {
        const processResult = await processReceipt(
          uploadResult.data!.id,
          workspaceId
        );

        if (processResult.success) {
          // Auto-create: try to confirm automatically
          if (autoCreate) {
            const autoConfirmed = await tryAutoConfirm(
              uploadResult.data!.id,
              processResult.data?.extractedData ?? null
            );

            if (autoConfirmed) {
              toast.success("Transacción creada automáticamente");
            } else {
              toast.warning(
                "No se pudo crear automáticamente. Revisá los datos.",
                { description: "Faltan datos para crear la transacción" }
              );
            }
          } else {
            toast.success("Datos extraídos correctamente");
          }
        } else {
          toast.error(
            processResult.error || "Error al analizar el recibo"
          );
        }
      });
    },
    [workspaceId, startTransition, autoCreate, tryAutoConfirm]
  );

  // Handle confirm (open sheet)
  const handleConfirm = useCallback((receipt: ReceiptItem) => {
    setSelectedReceipt(receipt);
    setConfirmSheetOpen(true);
  }, []);

  // Handle retry
  const handleRetry = useCallback(
    (receiptId: string) => {
      setRetryingIds((prev) => new Set(prev).add(receiptId));

      startTransition(async () => {
        const result = await retryReceipt(receiptId, workspaceId);

        setRetryingIds((prev) => {
          const next = new Set(prev);
          next.delete(receiptId);
          return next;
        });

        if (result.success) {
          toast.success("Datos extraídos correctamente");
        } else {
          toast.error(result.error || "Error al reintentar");
        }
      });
    },
    [workspaceId, startTransition]
  );

  // Handle delete
  const handleDelete = useCallback(
    (receiptId: string) => {
      setDeletingIds((prev) => new Set(prev).add(receiptId));

      startTransition(async () => {
        const result = await deleteReceipt(receiptId, workspaceId);

        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(receiptId);
          return next;
        });

        if (result.success) {
          toast.success("Recibo eliminado");
        } else {
          toast.error(result.error || "Error al eliminar");
        }
      });
    },
    [workspaceId, startTransition]
  );

  // Handle confirm sheet close
  const handleConfirmOpenChange = useCallback((open: boolean) => {
    setConfirmSheetOpen(open);
    if (!open) {
      setSelectedReceipt(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Recibos</h1>
            <ScanLine className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Subí fotos de recibos y la IA extrae los datos automáticamente
          </p>
        </div>

        {/* Auto-create toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="auto-create"
            checked={autoCreate}
            onCheckedChange={handleAutoCreateChange}
          />
          <Label
            htmlFor="auto-create"
            className="flex items-center gap-1.5 text-sm cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            Crear automáticamente
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="¿Cómo funciona?"
              >
                <CircleHelp className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 text-sm space-y-2"
              side="bottom"
              align="end"
            >
              <p className="font-semibold">¿Cómo funciona?</p>
              <p className="text-muted-foreground">
                Cuando está activado, al subir un recibo la IA extrae los
                datos y <strong>crea la transacción automáticamente</strong>{" "}
                sin pedirte confirmación.
              </p>
              <p className="text-muted-foreground">
                Usa la <strong>primera cuenta</strong> disponible, la{" "}
                <strong>categoría sugerida</strong> por la IA (si coincide),
                y la fecha del recibo.
              </p>
              <p className="text-muted-foreground">
                Si faltan datos (ej: el monto no se pudo leer), te avisa
                para que los completes manualmente.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Uploader */}
      <ReceiptUploader onUpload={handleUpload} />

      {/* Receipt list */}
      <ReceiptList
        receipts={initialReceipts}
        currency={currency}
        onConfirm={handleConfirm}
        onRetry={handleRetry}
        onDelete={handleDelete}
        retryingIds={retryingIds}
        deletingIds={deletingIds}
      />

      {/* Confirm form sheet (lazy loaded) */}
      {confirmSheetOpen && (
        <ReceiptConfirmForm
          open={confirmSheetOpen}
          onOpenChange={handleConfirmOpenChange}
          receipt={selectedReceipt}
          accounts={accounts}
          categories={categories}
          workspaceId={workspaceId}
          workspaceType={workspaceType}
        />
      )}
    </div>
  );
}
