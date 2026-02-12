import { CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RecurringsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Recurrentes</h1>
        <p className="text-muted-foreground mt-1">
          Controlá tus pagos e ingresos recurrentes.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Próximamente
          </CardTitle>
          <CardDescription>
            Esta sección está en desarrollo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Acá vas a poder registrar pagos e ingresos recurrentes (Netflix, Spotify, 
            retainers de clientes, hosting, etc.), ver cuánto gastás por mes y recibir 
            recordatorios de vencimiento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
