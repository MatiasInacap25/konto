"use client";

import { useEffect, useMemo, useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  confirmReceiptSchema,
  type ConfirmReceiptFormData,
} from "@/lib/validations/receipt";
import { confirmReceipt } from "@/actions/receipts";
import type { ReceiptItem } from "@/lib/queries/receipts";
import type { AccountOption, CategoryOption, TaxRuleOption } from "@/types/transactions";

type ReceiptConfirmFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptItem | null;
  accounts: AccountOption[];
  categories: CategoryOption[];
  taxRules: TaxRuleOption[];
  workspaceId: string;
  workspaceType: "PERSONAL" | "BUSINESS";
  defaultAccountId: string | null;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ReceiptConfirmForm({
  open,
  onOpenChange,
  receipt,
  accounts,
  categories,
  taxRules,
  workspaceId,
  workspaceType,
  defaultAccountId,
}: ReceiptConfirmFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedTaxRuleId, setSelectedTaxRuleId] = useState<string>("");

  // Filter only expense categories (receipts are always expenses)
  // Memoize to prevent unstable ref in useEffect dependency array
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "EXPENSE"),
    [categories]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ConfirmReceiptFormData>({
    resolver: zodResolver(confirmReceiptSchema),
    defaultValues: {
      receiptId: "",
      amount: "",
      description: "",
      date: new Date(),
      accountId: "",
      categoryId: "",
      taxRuleId: "",
      scope: workspaceType === "PERSONAL" ? "PERSONAL" : "BUSINESS",
    },
  });

  // Reset form when receipt changes or sheet opens
  useEffect(() => {
    if (open && receipt) {
      const extracted = receipt.extractedData;

      // Try to match suggested category to an existing category
      let matchedCategoryId = "";
      if (extracted?.suggestedCategory) {
        const match = expenseCategories.find(
          (c) =>
            c.name.toLowerCase() ===
            extracted.suggestedCategory?.toLowerCase()
        );
        if (match) {
          matchedCategoryId = match.id;
        }
      }

      reset({
        receiptId: receipt.id,
        amount: extracted?.amount != null ? String(extracted.amount) : "",
        description:
          extracted?.description ||
          extracted?.merchant ||
          "",
        date: extracted?.date ? new Date(extracted.date) : new Date(),
        accountId: defaultAccountId || accounts[0]?.id || "",
        categoryId: matchedCategoryId,
        taxRuleId: "",
        scope: workspaceType === "PERSONAL" ? "PERSONAL" : "BUSINESS",
      });
      setSelectedTaxRuleId("");
    }
  }, [open, receipt, reset, accounts, workspaceType, expenseCategories, defaultAccountId]);

  const onSubmit = (data: ConfirmReceiptFormData) => {
    startTransition(async () => {
      const result = await confirmReceipt({
        ...data,
        taxRuleId: selectedTaxRuleId || undefined,
      }, workspaceId);
      if (result.success) {
        toast.success("Transacción creada desde recibo");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Error al confirmar recibo");
      }
    });
  };

  const selectedDate = watch("date");
  const selectedAmount = watch("amount");

  // Calcular impuesto
  const calculatedTax = useMemo(() => {
    const rule = taxRules.find(r => r.id === selectedTaxRuleId);
    if (!rule || !selectedAmount) return null;
    const amount = parseFloat(selectedAmount.replace(/[^\d.-]/g, ""));
    if (isNaN(amount) || amount <= 0) return null;
    return {
      amount: amount * (rule.percentage / 100),
      rate: rule.percentage,
      ruleName: rule.name,
    };
  }, [selectedTaxRuleId, selectedAmount, taxRules]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Confirmar transacción</SheetTitle>
          <SheetDescription>
            Revisá los datos extraídos por la IA y confirmá para crear la
            transacción.
          </SheetDescription>
        </SheetHeader>

        {/* Receipt image preview */}
        {receipt && (
          <div className="mt-4 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receipt.fileUrl}
              alt={receipt.fileName}
              className="w-full h-40 object-cover rounded-lg border"
            />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              placeholder="0"
              {...register("amount")}
              className={cn(errors.amount && "border-destructive")}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Descripción del gasto"
              rows={2}
              {...register("description")}
              className={cn(errors.description && "border-destructive")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                    errors.date && "border-destructive"
                  )}
                >
                  {selectedDate ? formatDate(selectedDate) : "Seleccioná una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) setValue("date", date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-xs text-destructive">
                {errors.date.message}
              </p>
            )}
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label>Cuenta</Label>
            <Select
              value={watch("accountId")}
              onValueChange={(value) => setValue("accountId", value)}
            >
              <SelectTrigger
                className={cn(errors.accountId && "border-destructive")}
              >
                <SelectValue placeholder="Seleccioná una cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && (
              <p className="text-xs text-destructive">
                {errors.accountId.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={watch("categoryId") || "__none__"}
              onValueChange={(value) =>
                setValue("categoryId", value === "__none__" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin categoría</SelectItem>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tax Rule */}
          {taxRules.length > 0 && (
            <div className="space-y-2">
              <Label>
                Impuesto <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
              </Label>
              <Select
                value={selectedTaxRuleId || "__none__"}
                onValueChange={(value) =>
                  setSelectedTaxRuleId(value === "__none__" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin impuesto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin impuesto</SelectItem>
                  {taxRules.filter(r => r.isActive !== false).map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      {rule.name} ({rule.percentage}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Mostrar cálculo de impuesto */}
              {calculatedTax && (
                <div className="mt-2 p-2 bg-muted/50 rounded-md text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">${parseFloat(selectedAmount.replace(/[^\d.-]/g, "")).toLocaleString("es-CL")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{calculatedTax.ruleName} ({calculatedTax.rate}%):</span>
                    <span className="font-medium text-destructive">
                      +${calculatedTax.amount.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Total:</span>
                    <span>${(parseFloat(selectedAmount.replace(/[^\d.-]/g, "")) + calculatedTax.amount).toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scope */}
          <div className="space-y-2">
            <Label>Alcance</Label>
            <Select
              value={watch("scope")}
              onValueChange={(value) =>
                setValue(
                  "scope",
                  value as "PERSONAL" | "BUSINESS" | "MIXED"
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERSONAL">Personal</SelectItem>
                <SelectItem value="BUSINESS">Negocio</SelectItem>
                <SelectItem value="MIXED">Mixto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creando...
              </>
            ) : (
              "Crear transacción"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
