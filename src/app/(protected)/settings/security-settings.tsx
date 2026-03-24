"use client";

import { useEffect, useState } from "react";
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
import { Laptop, Smartphone, Monitor, LogOut, Trash2, Shield, KeyRound } from "lucide-react";

type Session = {
  id: string;
  device: string;
  os: string;
  browser: string;
  ip: string;
  lastActive: string;
  currentSession: boolean;
};

export function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      // Get current session info
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSessions([]);
        return;
      }

      // For demo purposes, we'll create mock sessions based on user agent
      // In production, you would use Supabase's admin API to list all sessions
      // This requires Supabase Auth Admin privileges
      const mockSessions: Session[] = [
        {
          id: user.id,
          device: "current",
          os: navigator.platform,
          browser: "Navegador actual",
          ip: "192.168.1.1",
          lastActive: "Ahora",
          currentSession: true,
        },
      ];

      setSessions(mockSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleChangePassword = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        toast.error("No se encontró el email del usuario");
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Email de recuperación enviado");
    } catch (error) {
      toast.error("Error al cambiar contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOutAll = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Sesiones cerradas. Volviendo al login...");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Error al cerrar sesiones");
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device === "current") return <Monitor className="h-4 w-4" />;
    return <Laptop className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>
            Actualizá tu contraseña de acceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleChangePassword} disabled={isLoading}>
            <KeyRound className="mr-2 h-4 w-4" />
            Enviar email de recuperación
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Autenticación de dos factores (2FA)</CardTitle>
          <CardDescription>
            Agregá una capa extra de seguridad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Estado</p>
                <p className="text-sm text-muted-foreground">Desactivado</p>
              </div>
            </div>
            <Button variant="outline" disabled>
              Coming soon
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sesiones activas</CardTitle>
          <CardDescription>
            Dispositivos donde tenés sesión iniciada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingSessions ? (
            <p className="text-sm text-muted-foreground">Cargando sesiones...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay sesiones activas.
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {session.browser}
                          {session.currentSession && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Actual
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.os} • IP: {session.ip}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Última actividad: {session.lastActive}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleSignOutAll}
            variant="destructive"
            disabled={isLoading}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar todas las sesiones
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Eliminar cuenta</CardTitle>
          <CardDescription>
            Eliminá tu cuenta y todos los datos asociados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled={isLoading}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar mi cuenta
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            * Esta acción es irreversible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
