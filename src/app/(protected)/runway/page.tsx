import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlanGate } from "@/components/shared/plan-gate";

export default function RunwayPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Proyección (Runway)</h1>
        <p className="text-muted-foreground mt-1">
          Proyectá cuánto tiempo te dura tu capital actual.
        </p>
      </div>

      <PlanGate requiredPlan="PRO" behavior="blur">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Próximamente
            </CardTitle>
            <CardDescription>
              Esta sección está en desarrollo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Acá vas a poder ver proyecciones de tu runway basadas en tus 
              ingresos y gastos promedio. Ideal para freelancers que quieren 
              planificar a futuro.
            </p>
          </CardContent>
        </Card>
      </PlanGate>
    </div>
  );
}
