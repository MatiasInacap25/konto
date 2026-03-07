"use client";

import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { withdrawFromGoal } from "@/actions/savings";
import { toast } from "sonner";
import {
  withdrawSchema,
  parseAmount,
  type WithdrawFormData,
} from "@/lib/validations/savings";
import type { GoalWithProgress, AccountOption } from "@/types/savings";

type WithdrawDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: GoalWithProgress | null;
  accounts: AccountOption[];
};

export function WithdrawDialog({
  open,
  onOpenChange,
  goal,
  accounts,
}: WithdrawDialogProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      goalId: "",
      toAccountId: "",
      amount: "",
      date: new Date(),
    },
  });

  // Reset form when goal changes
  useEffect(() => {
    if (goal && open) {
      reset({
        goalId: goal.id,
        toAccountId: "",
        amount: "",
        date: new Date(),
      });
    }
  }, [goal, open, reset]);

  const onSubmit = (data: WithdrawFormData) => {
    if (!goal) return;

    startTransition(async () => {
      const amount = parseAmount(data.amount);

      const result = await withdrawFromGoal({
        goalId: goal.id,
        toAccountId: data.toAccountId,
        amount,
        date: data.date || new Date(),
      });

      if (result.success) {
        toast.success("Retiro realizado exitosamente");
        onOpenChange(false);
        reset();
      } else {
        toast.error(result.error || "Error al realizar retiro");
      }
    });
  };

  if (!goal) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirar de meta</DialogTitle>
          <DialogDescription>
            Transferí fondos desde tu meta de ahorro hacia una de tus cuentas
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">
            {goal.emoji} {goal.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Disponible: {formatCurrency(goal.currentBalance)}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* To Account */}
          <div className="space-y-2">
            <Label htmlFor="toAccountId">
              Hacia cuenta <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="toAccountId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="toAccountId" aria-invalid={!!errors.toAccountId}>
                    <SelectValue placeholder="Seleccioná una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} — {formatCurrency(account.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.toAccountId && (
              <p className="text-sm text-destructive">{errors.toAccountId.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Monto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0"
              {...register("amount")}
              aria-invalid={!!errors.amount}
            />
            <p className="text-xs text-muted-foreground">
              Máximo: {formatCurrency(goal.currentBalance)}
            </p>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2" />
                      {field.value ? (
                        format(field.value, "PPP", { locale: es })
                      ) : (
                        <span>Seleccioná una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Retirando...
                </>
              ) : (
                "Retirar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
