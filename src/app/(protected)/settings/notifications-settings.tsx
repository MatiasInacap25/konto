"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Bell, Volume2, Smartphone } from "lucide-react";

type NotificationPreferences = {
  emailNotifications: boolean;
  weeklyReport: boolean;
  transactionAlerts: boolean;
  marketingEmails: boolean;
  pushNotifications: boolean;
  pushSound: boolean;
};

export function NotificationsSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    weeklyReport: true,
    transactionAlerts: true,
    marketingEmails: false,
    pushNotifications: true,
    pushSound: true,
  });
  const supabase = createClient();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setIsLoadingPrefs(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("UserNotificationPreferences")
        .select("*")
        .eq("userId", user.id)
        .single();

      if (data) {
        setPreferences({
          emailNotifications: data.emailNotifications ?? true,
          weeklyReport: data.weeklyReport ?? true,
          transactionAlerts: data.transactionAlerts ?? true,
          marketingEmails: data.marketingEmails ?? false,
          pushNotifications: data.pushNotifications ?? true,
          pushSound: data.pushSound ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setIsLoadingPrefs(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("No autenticado");
        return;
      }

      const { error } = await supabase
        .from("UserNotificationPreferences")
        .upsert({
          userId: user.id,
          emailNotifications: preferences.emailNotifications,
          weeklyReport: preferences.weeklyReport,
          transactionAlerts: preferences.transactionAlerts,
          marketingEmails: preferences.marketingEmails,
          pushNotifications: preferences.pushNotifications,
          pushSound: preferences.pushSound,
        }, {
          onConflict: "userId",
        });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Preferencias guardadas correctamente");
    } catch (error) {
      toast.error("Error al guardar preferencias");
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoadingPrefs) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones por email</CardTitle>
            <CardDescription>Cargando...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones por email</CardTitle>
          <CardDescription>
            Elegí qué tipo de emails querés recibir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Notificaciones generales</p>
                <p className="text-sm text-muted-foreground">
                  Recibí emails sobre tu cuenta y actividad.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) =>
                updatePreference("emailNotifications", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-5 h-5">
                <span className="text-xs font-bold">7</span>
              </div>
              <div>
                <p className="font-medium">Reporte semanal</p>
                <p className="text-sm text-muted-foreground">
                  Resumen semanal de tus finanzas.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.weeklyReport}
              onCheckedChange={(checked) =>
                updatePreference("weeklyReport", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Alertas de transacciones</p>
                <p className="text-sm text-muted-foreground">
                  Notificaciones cuando se registran movimientos.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.transactionAlerts}
              onCheckedChange={(checked) =>
                updatePreference("transactionAlerts", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-5 h-5">
                <span className="text-lg">📢</span>
              </div>
              <div>
                <p className="font-medium">Emails de marketing</p>
                <p className="text-sm text-muted-foreground">
                  Novedades, actualizaciones y ofertas.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.marketingEmails}
              onCheckedChange={(checked) =>
                updatePreference("marketingEmails", checked)
              }
            />
          </div>

          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar preferencias"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias del sistema</CardTitle>
          <CardDescription>
            Configuración de notificaciones en la app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Notificaciones push</p>
                <p className="text-sm text-muted-foreground">
                  Recibí notificaciones en tu dispositivo.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.pushNotifications}
              onCheckedChange={(checked) =>
                updatePreference("pushNotifications", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Sonido</p>
                <p className="text-sm text-muted-foreground">
                  Reproducir sonido con las notificaciones.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.pushSound}
              onCheckedChange={(checked) =>
                updatePreference("pushSound", checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
