"use client";

import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createSavingsGoal, updateSavingsGoal } from "@/actions/savings";
import { toast } from "sonner";
import {
  createGoalSchema,
  parseAmount,
  type CreateGoalFormData,
} from "@/lib/validations/savings";
import type { GoalItem } from "@/types/savings";

type GoalSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: GoalItem | null;
  workspaceId: string;
};

export function GoalSheet({
  open,
  onOpenChange,
  goal,
  workspaceId,
}: GoalSheetProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!goal;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateGoalFormData>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      name: "",
      emoji: "",
      description: "",
      targetAmount: "",
      deadline: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      if (goal) {
        reset({
          name: goal.name,
          emoji: goal.emoji ?? "",
          description: goal.description ?? "",
          targetAmount: String(goal.targetAmount),
          deadline: goal.deadline ?? undefined,
        });
      } else {
        reset({
          name: "",
          emoji: "",
          description: "",
          targetAmount: "",
          deadline: undefined,
        });
      }
    }
  }, [open, goal, reset]);

  const onSubmit = (data: CreateGoalFormData) => {
    startTransition(async () => {
      const targetAmount = parseAmount(data.targetAmount);

      if (isEditing && goal) {
        const result = await updateSavingsGoal({
          id: goal.id,
          name: data.name,
          emoji: data.emoji || undefined,
          description: data.description || undefined,
          targetAmount,
          deadline: data.deadline,
        });

        if (result.success) {
          toast.success("Meta actualizada");
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar meta");
        }
      } else {
        const result = await createSavingsGoal({
          name: data.name,
          emoji: data.emoji || undefined,
          description: data.description || undefined,
          targetAmount,
          deadline: data.deadline,
          workspaceId,
        });

        if (result.success) {
          toast.success("Meta creada");
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al crear meta");
        }
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[400px] overflow-y-auto px-6">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-base font-semibold">
            {isEditing ? "Editar meta" : "Nueva meta de ahorro"}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {isEditing
              ? "Modificá los detalles de tu meta"
              : "Creá una meta para ahorrar hacia un objetivo específico"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-1">
          {/* Name + Emoji */}
          <div className="grid grid-cols-[1fr,56px] gap-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ej: Viaje a Europa"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emoji" className="text-sm font-medium">
                Emoji <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="emoji"
                placeholder="🏖️"
                maxLength={2}
                {...register("emoji")}
                aria-invalid={!!errors.emoji}
                className="text-center text-xl"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">
              Descripción (opcional)
            </Label>
            <Textarea
              id="description"
              placeholder="Ej: Vacaciones de verano"
              rows={2}
              {...register("description")}
              aria-invalid={!!errors.description}
              className="resize-none"
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="targetAmount" className="text-sm font-medium">
              Monto objetivo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="targetAmount"
              type="text"
              inputMode="decimal"
              placeholder="1.500.000"
              {...register("targetAmount")}
              aria-invalid={!!errors.targetAmount}
            />
            <p className="text-xs text-muted-foreground">
              Formato: 1.500.000 o 1500000
            </p>
            {errors.targetAmount && (
              <p className="text-sm text-destructive">{errors.targetAmount.message}</p>
            )}
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Fecha límite (opcional)</Label>
            <Controller
              name="deadline"
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
                      <Calendar className="mr-2 h-4 w-4" />
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
                      disabled={(date) => date <= new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Te calcularemos cuánto ahorrar por mes
            </p>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Guardando..." : "Creando..."}
                </>
              ) : isEditing ? (
                "Guardar"
              ) : (
                "Crear"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
