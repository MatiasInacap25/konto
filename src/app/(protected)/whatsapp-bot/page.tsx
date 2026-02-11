import { MessageCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlanGate } from "@/components/shared/plan-gate";

export default function WhatsAppBotPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bot WhatsApp</h1>
        <p className="text-muted-foreground mt-1">
          Registrá transacciones hablando por WhatsApp.
        </p>
      </div>

      <PlanGate requiredPlan="BUSINESS" behavior="blur">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Próximamente
            </CardTitle>
            <CardDescription>
              Esta sección está en desarrollo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Acá vas a poder conectar tu WhatsApp y registrar transacciones 
              simplemente enviando un mensaje como &quot;Pagué $50.000 en el super&quot;. 
              La IA extrae los datos y los registra automáticamente.
            </p>
          </CardContent>
        </Card>
      </PlanGate>
    </div>
  );
}
