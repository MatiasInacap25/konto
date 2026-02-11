import { Receipt } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlanGate } from "@/components/shared/plan-gate";

export default function ReceiptsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Recibos</h1>
        <p className="text-muted-foreground mt-1">
          Guardá y organizá tus comprobantes de pago.
        </p>
      </div>

      <PlanGate requiredPlan="PRO" behavior="blur">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Próximamente
            </CardTitle>
            <CardDescription>
              Esta sección está en desarrollo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Acá vas a poder subir fotos de recibos, extraer datos con IA, 
              y asociarlos a transacciones automáticamente.
            </p>
          </CardContent>
        </Card>
      </PlanGate>
    </div>
  );
}
