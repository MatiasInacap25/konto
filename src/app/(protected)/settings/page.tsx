import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "./profile-settings";
import { PlanSettings } from "./plan-settings";
import { WorkspaceSettings } from "./workspace-settings";
import { SecuritySettings } from "./security-settings";
import { NotificationsSettings } from "./notifications-settings";
import { ProfileSkeleton } from "./profile-skeleton";
import { PlanSkeleton } from "./plan-skeleton";
import { WorkspaceSkeleton } from "./workspace-skeleton";
import { SecuritySkeleton } from "./security-skeleton";
import { NotificationsSkeleton } from "./notifications-skeleton";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Personalizá tu experiencia en Konto.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid lg:grid-cols-5">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Suspense fallback={<ProfileSkeleton />}>
            <ProfileSettings />
          </Suspense>
        </TabsContent>

        <TabsContent value="plan">
          <Suspense fallback={<PlanSkeleton />}>
            <PlanSettings />
          </Suspense>
        </TabsContent>

        <TabsContent value="workspace">
          <Suspense fallback={<WorkspaceSkeleton />}>
            <WorkspaceSettings />
          </Suspense>
        </TabsContent>

        <TabsContent value="security">
          <Suspense fallback={<SecuritySkeleton />}>
            <SecuritySettings />
          </Suspense>
        </TabsContent>

        <TabsContent value="notifications">
          <Suspense fallback={<NotificationsSkeleton />}>
            <NotificationsSettings />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
