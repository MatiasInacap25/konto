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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type AutoCreateConfig = {
  enabled: boolean;
  accountId: string | null;
};

function loadAutoCreateConfig(): AutoCreateConfig {
  try {
    const stored = localStorage.getItem(AUTO_CREATE_KEY);
    if (!stored) return { enabled: false, accountId: null };

    // Migrate from old format ("true"/"false" string)
    if (stored === "true") return { enabled: true, accountId: null };
    if (stored === "false") return { enabled: false, accountId: null };

    return JSON.parse(stored) as AutoCreateConfig;
  } catch {
    return { enabled: false, accountId: null };
  }
}

function saveAutoCreateConfig(config: AutoCreateConfig) {
  try {
    localStorage.setItem(AUTO_CREATE_KEY, JSON.stringify(config));
  } catch {
    // localStorage unavailable
  }
}

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

  // Auto-create config — persisted in localStorage
  const [autoCreateConfig, setAutoCreateConfig] = useState<AutoCreateConfig>({
    enabled: false,
    accountId: null,
  });

  useEffect(() => {
    setAutoCreateConfig(loadAutoCreateConfig());
  }, []);

  const handleAutoCreateToggle = useCallback(
    (checked: boolean) => {
      const updated: AutoCreateConfig = {
        enabled: checked,
        // When enabling, default to first account if none selected
        accountId: checked
          ? autoCreateConfig.accountId || accounts[0]?.id || null
          : autoCreateConfig.accountId,
      };
      setAutoCreateConfig(updated);
      saveAutoCreateConfig(updated);
    },
    [autoCreateConfig.accountId, accounts]
  );

  const handleAutoCreateAccountChange = useCallback(
    (accountId: string) => {
      const updated: AutoCreateConfig = {
        ...autoCreateConfig,
        accountId,
      };
      setAutoCreateConfig(updated);
      saveAutoCreateConfig(updated);
    },
    [autoCreateConfig]
  );

  // Resolve the effective account ID for auto-create and default selection
  const resolvedAccountId =
    autoCreateConfig.accountId &&
    accounts.some((a) => a.id === autoCreateConfig.accountId)
      ? autoCreateConfig.accountId
      : accounts[0]?.id || null;

  // Build auto-confirm data from extracted receipt data
  const tryAutoConfirm = useCallback(
    async (
      receiptId: string,
      extractedData: ExtractedReceiptData | null
    ): Promise<boolean> => {
      if (!extractedData?.amount || !resolvedAccountId) {
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
        accountId: resolvedAccountId,
        categoryId: matchedCategoryId,
        scope: (workspaceType === "PERSONAL" ? "PERSONAL" : "BUSINESS") as
          | "PERSONAL"
          | "BUSINESS"
          | "MIXED",
      };

      const result = await confirmReceipt(confirmData, workspaceId);
      return result.success;
    },
    [resolvedAccountId, categories, workspaceId, workspaceType]
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
          if (autoCreateConfig.enabled) {
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
    [workspaceId, startTransition, autoCreateConfig.enabled, tryAutoConfirm]
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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Recibos</h1>
            <ScanLine className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Subí fotos de recibos y la IA extrae los datos automáticamente
          </p>
        </div>

        {/* Auto-create toggle + account selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-create"
              checked={autoCreateConfig.enabled}
              onCheckedChange={handleAutoCreateToggle}
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
                  Usa la <strong>cuenta seleccionada abajo</strong>, la{" "}
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

          {/* Account selector — visible when auto-create is ON */}
          {autoCreateConfig.enabled && (
            <Select
              value={resolvedAccountId || ""}
              onValueChange={handleAutoCreateAccountChange}
            >
              <SelectTrigger className="w-full sm:w-48 h-8 text-xs">
                <SelectValue placeholder="Elegí una cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
          defaultAccountId={resolvedAccountId}
        />
      )}
    </div>
  );
}
