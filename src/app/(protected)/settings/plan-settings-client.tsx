"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { Plan } from "@/types/plans";
import { Check, Crown, Zap, Building2, Star } from "lucide-react";

type PlanSettingsClientProps = {
  initialPlan: Plan | null;
};

const PLAN_INFO: Record<Plan, { name: string; price: string; description: string }> = {
  STARTER: { name: "Starter", price: "Gratis", description: "Uso básico" },
  PRO: { name: "Pro", price: "$15/mes", description: "Proyección y más negocios" },
  PRO_PLUS: { name: "Pro Plus", price: "$25/mes", description: "Boletas y XML" },
  BUSINESS: { name: "Business", price: "$39/mes", description: "Conexión bancaria" },
  ENTERPRISE: { name: "Enterprise", price: "Custom", description: "Para equipos grandes" },
};

export function PlanSettingsClient({ initialPlan }: PlanSettingsClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const currentPlan = initialPlan || "STARTER";
  const currentPlanInfo = PLAN_INFO[currentPlan];

  const handleUpgrade = async (targetPlan: Plan) => {
    setIsLoading(true);
    try {
      // TODO: Integrate with Stripe/Superwall for upgrades
      toast.info(`Redireccionando a página de pago para ${PLAN_INFO[targetPlan].name}...`);
    } catch (error) {
      toast.error("Error al procesar el upgrade");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plan actual</CardTitle>
          <CardDescription>
            Información sobre tu plan de suscripción.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-lg">{currentPlanInfo.name}</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlanInfo.price} - {currentPlanInfo.description}
                </p>
              </div>
            </div>
            <Button variant="outline" disabled>
              Actual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Actualizar plan</CardTitle>
          <CardDescription>
            Obtené más funcionalidades con un plan superior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PRO */}
          {currentPlan === "STARTER" && (
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Plan Pro</p>
                  <p className="text-sm text-muted-foreground">
                    $15/mes - Proyección, más negocios y categorías
                  </p>
                </div>
              </div>
              <Button onClick={() => handleUpgrade("PRO")} disabled={isLoading}>
                Upgrade
              </Button>
            </div>
          )}

          {/* PRO PLUS */}
          {["STARTER", "PRO"].includes(currentPlan) && (
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Plan Pro Plus</p>
                  <p className="text-sm text-muted-foreground">
                    $25/mes - Guardá boletas y XML
                  </p>
                </div>
              </div>
              <Button onClick={() => handleUpgrade("PRO_PLUS")} disabled={isLoading}>
                Upgrade
              </Button>
            </div>
          )}

          {/* BUSINESS */}
          {["STARTER", "PRO", "PRO_PLUS"].includes(currentPlan) && (
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                  <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Plan Business</p>
                  <p className="text-sm text-muted-foreground">
                    $39/mes - Conexión bancaria con Fintoc
                  </p>
                </div>
              </div>
              <Button onClick={() => handleUpgrade("BUSINESS")} disabled={isLoading}>
                Upgrade
              </Button>
            </div>
          )}

          {/* Already on highest plan */}
          {currentPlan === "BUSINESS" && (
            <div className="flex items-center justify-between p-4 rounded-lg border bg-primary/5">
              <div>
                <p className="font-medium">¡Ya tenés el mejor plan!</p>
                <p className="text-sm text-muted-foreground">
                  Disfrutá de todas las funcionalidades disponibles.
                </p>
              </div>
              <Check className="h-5 w-5 text-green-600" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de facturación</CardTitle>
          <CardDescription>
            Tu historial de pagos y facturas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {currentPlan === "STARTER"
              ? "No tenés facturas porque estás en el plan gratuito."
              : "Tu historial de facturas aparecerá aquí."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
