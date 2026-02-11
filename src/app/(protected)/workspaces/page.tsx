import { Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function WorkspacesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Workspaces</h1>
        <p className="text-muted-foreground mt-1">
          Gestioná tus espacios de trabajo personales y de negocio.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Próximamente
          </CardTitle>
          <CardDescription>
            Esta sección está en desarrollo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Acá vas a poder crear workspaces de negocio, configurar la moneda, 
            y administrar la configuración de cada espacio.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
