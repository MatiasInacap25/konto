import { Tags } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CategoriesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Categorías</h1>
        <p className="text-muted-foreground mt-1">
          Organizá tus transacciones con categorías personalizadas.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Próximamente
          </CardTitle>
          <CardDescription>
            Esta sección está en desarrollo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Acá vas a poder crear categorías y subcategorías para clasificar 
            tus ingresos y gastos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
