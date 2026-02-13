"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2, Banknote, Smartphone, CreditCard, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAccount, updateAccount } from "@/actions/accounts";
import { toast } from "sonner";
import {
  createAccountSchema,
  parseAmount,
  type CreateAccountFormData,
} from "@/lib/validations/account";
import type { AccountType } from "@/types/accounts";

type AccountData = {
  id: string;
  name: string;
  balance: number;
  isBusiness: boolean;
  lastActivityAt: Date | null;
  transactionCount: number;
};

type AccountSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AccountData | null;
  workspaceId: string;
  workspaceType: "PERSONAL" | "BUSINESS";
};

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: typeof Building2 }[] = [
  { value: "BANK", label: "Banco", icon: Building2 },
  { value: "CASH", label: "Efectivo", icon: Banknote },
  { value: "DIGITAL", label: "Digital", icon: Smartphone },
  { value: "CARD", label: "Tarjeta", icon: CreditCard },
  { value: "INVESTMENT", label: "Inversión", icon: TrendingUp },
];

/**
 * Infer account type from name (for editing existing accounts)
 */
function inferAccountType(name: string): AccountType {
  const lower = name.toLowerCase();

  if (lower.includes("efectivo") || lower.includes("cash") || lower.includes("billetera")) {
    return "CASH";
  }
  if (lower.includes("mercado pago") || lower.includes("paypal") || lower.includes("wise") || 
      lower.includes("revolut") || lower.includes("digital")) {
    return "DIGITAL";
  }
  if (lower.includes("tarjeta") || lower.includes("card") || lower.includes("crédito") || 
      lower.includes("débito")) {
    return "CARD";
  }
  if (lower.includes("inversión") || lower.includes("investment") || lower.includes("fondo") || 
      lower.includes("acciones")) {
    return "INVESTMENT";
  }

  return "BANK";
}

export function AccountSheet({
  open,
  onOpenChange,
  account,
  workspaceId,
  workspaceType,
}: AccountSheetProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!account;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: "",
      type: "BANK",
      balance: "0",
      isBusiness: workspaceType === "BUSINESS",
    },
  });

  const selectedType = watch("type");
  const isBusiness = watch("isBusiness");

  useEffect(() => {
    if (open) {
      if (account) {
        reset({
          name: account.name,
          type: inferAccountType(account.name),
          balance: String(account.balance),
          isBusiness: account.isBusiness,
        });
      } else {
        reset({
          name: "",
          type: "BANK",
          balance: "0",
          isBusiness: workspaceType === "BUSINESS",
        });
      }
    }
  }, [open, account, reset, workspaceType]);

  const onSubmit = (data: CreateAccountFormData) => {
    startTransition(async () => {
      const balance = parseAmount(data.balance);

      if (isEditing && account) {
        const result = await updateAccount({
          id: account.id,
          name: data.name,
          type: data.type,
          balance,
          isBusiness: data.isBusiness,
          workspaceId,
        });

        if (result.success) {
          toast.success("Cuenta actualizada");
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar");
        }
      } else {
        const result = await createAccount({
          name: data.name,
          type: data.type,
          balance,
          isBusiness: data.isBusiness,
          workspaceId,
        });

        if (result.success) {
          toast.success("Cuenta creada");
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al crear");
        }
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[400px] overflow-y-auto flex flex-col gap-0 px-6">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-base font-semibold">
            {isEditing ? "Editar cuenta" : "Nueva cuenta"}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {isEditing
              ? "Modificá los datos de la cuenta."
              : "Agregá una cuenta bancaria, efectivo o billetera virtual."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col px-1">
          <div className="space-y-5 flex-1">
            {/* Account name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre
              </Label>
              <Input
                id="name"
                placeholder="Ej: Banco Estado, Mercado Pago, Efectivo..."
                autoComplete="off"
                className={cn(
                  "h-10",
                  errors.name && "border-destructive focus-visible:ring-destructive"
                )}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Account type */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tipo de cuenta</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setValue("type", value as AccountType)}
              >
                <SelectTrigger
                  className={cn(
                    "h-10",
                    errors.type && "border-destructive focus:ring-destructive"
                  )}
                >
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* Initial balance */}
            <div className="space-y-1.5">
              <Label htmlFor="balance" className="text-sm font-medium">
                {isEditing ? "Balance actual" : "Balance inicial"}
              </Label>
              <div className="relative w-fit">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="balance"
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  autoComplete="off"
                  className={cn(
                    "pl-7 text-lg font-semibold h-10 w-44",
                    "font-mono tabular-nums",
                    errors.balance && "border-destructive focus-visible:ring-destructive"
                  )}
                  {...register("balance")}
                />
              </div>
              {errors.balance && (
                <p className="text-xs text-destructive">{errors.balance.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Ajustá manualmente si necesitás reconciliar."
                  : "Podés empezar en 0 y ajustar después."}
              </p>
            </div>

            {/* Business flag — only show in business workspaces */}
            {workspaceType === "BUSINESS" && (
              <div className="flex items-center justify-between py-3 px-4 bg-muted/40 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="isBusiness" className="text-sm font-medium cursor-pointer">
                    Cuenta de negocio
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Marcá si es una cuenta exclusiva del negocio.
                  </p>
                </div>
                <Switch
                  id="isBusiness"
                  checked={isBusiness}
                  onCheckedChange={(checked: boolean) => setValue("isBusiness", checked)}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 mt-4 mb-4 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                "Guardar"
              ) : (
                "Crear cuenta"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
