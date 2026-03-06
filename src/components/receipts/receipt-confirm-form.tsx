"use client";

import { useEffect, useMemo, useTransition } from "react";
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
import type { AccountOption, CategoryOption } from "@/types/transactions";

type ReceiptConfirmFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptItem | null;
  accounts: AccountOption[];
  categories: CategoryOption[];
  workspaceId: string;
  workspaceType: "PERSONAL" | "BUSINESS";
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
  workspaceId,
  workspaceType,
}: ReceiptConfirmFormProps) {
  const [isPending, startTransition] = useTransition();

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
        accountId: accounts[0]?.id || "",
        categoryId: matchedCategoryId,
        scope: workspaceType === "PERSONAL" ? "PERSONAL" : "BUSINESS",
      });
    }
  }, [open, receipt, reset, accounts, workspaceType, expenseCategories]);

  const onSubmit = (data: ConfirmReceiptFormData) => {
    startTransition(async () => {
      const result = await confirmReceipt(data, workspaceId);
      if (result.success) {
        toast.success("Transacción creada desde recibo");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Error al confirmar recibo");
      }
    });
  };

  const selectedDate = watch("date");

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
