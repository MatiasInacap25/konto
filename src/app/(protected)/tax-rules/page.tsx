import { Calculator } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TaxRulesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Reglas de Impuestos</h1>
        <p className="text-muted-foreground mt-1">
          Configurá reglas para calcular impuestos automáticamente.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Próximamente
          </CardTitle>
          <CardDescription>
            Esta sección está en desarrollo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Acá vas a poder crear reglas de impuestos (IVA, retenciones, etc.) 
            que se aplican automáticamente a tus transacciones.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
