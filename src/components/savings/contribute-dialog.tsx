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
import { contributeToGoal } from "@/actions/savings";
import { toast } from "sonner";
import {
  contributeSchema,
  parseAmount,
  type ContributeFormData,
} from "@/lib/validations/savings";
import type { GoalWithProgress, AccountOption } from "@/types/savings";

type ContributeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: GoalWithProgress | null;
  accounts: AccountOption[];
};

export function ContributeDialog({
  open,
  onOpenChange,
  goal,
  accounts,
}: ContributeDialogProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ContributeFormData>({
    resolver: zodResolver(contributeSchema),
    defaultValues: {
      goalId: "",
      fromAccountId: "",
      amount: "",
      date: new Date(),
    },
  });

  // Reset form when goal changes
  useEffect(() => {
    if (goal && open) {
      reset({
        goalId: goal.id,
        fromAccountId: "",
        amount: "",
        date: new Date(),
      });
    }
  }, [goal, open, reset]);

  const onSubmit = (data: ContributeFormData) => {
    if (!goal) return;

    console.log("=== CONTRIBUTE FORM DATA ===");
    console.log("Goal ID:", goal.id);
    console.log("From Account ID:", data.fromAccountId);
    console.log("Amount (raw):", data.amount);
    console.log("Date:", data.date);

    startTransition(async () => {
      const amount = parseAmount(data.amount);
      console.log("Amount (parsed):", amount);

      const result = await contributeToGoal({
        goalId: goal.id,
        fromAccountId: data.fromAccountId,
        amount,
        date: data.date || new Date(),
      });

      console.log("Contribute result:", result);

      if (result.success) {
        toast.success("Aporte realizado exitosamente");
        onOpenChange(false);
        reset();
      } else {
        toast.error(result.error || "Error al realizar aporte");
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

  const remaining = Math.max(goal.targetAmount - goal.currentBalance, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aportar a meta</DialogTitle>
          <DialogDescription>
            Transferí fondos desde una de tus cuentas hacia tu meta de ahorro
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">
            {goal.emoji} {goal.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Faltan {formatCurrency(remaining)} para completar la meta
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* From Account */}
          <div className="space-y-2">
            <Label htmlFor="fromAccountId">
              Desde cuenta <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="fromAccountId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="fromAccountId" aria-invalid={!!errors.fromAccountId}>
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
            {errors.fromAccountId && (
              <p className="text-sm text-destructive">{errors.fromAccountId.message}</p>
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
                  Aportando...
                </>
              ) : (
                "Aportar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
