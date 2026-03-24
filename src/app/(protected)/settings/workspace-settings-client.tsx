"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { Home, Building2, Plus, Settings, UserPlus, Trash2, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type WorkspaceMember = {
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
};

type Workspace = {
  id: string;
  name: string;
  type: "PERSONAL" | "BUSINESS";
  role: "OWNER" | "ADMIN" | "MEMBER";
  currency: string;
  memberCount: number;
  members: WorkspaceMember[];
};

type WorkspaceSettingsClientProps = {
  workspaces: Workspace[];
};

export function WorkspaceSettingsClient({ workspaces }: WorkspaceSettingsClientProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCurrency, setEditCurrency] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = (workspace: Workspace) => {
    setEditingId(workspace.id);
    setEditName(workspace.name);
    setEditCurrency(workspace.currency);
  };

  const handleSaveEdit = async (workspaceId: string) => {
    setIsSaving(true);
    try {
      // TODO: Connect to server action for updating workspace
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Workspace actualizado correctamente");
      setEditingId(null);
    } catch (error) {
      toast.error("Error al actualizar el workspace");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditCurrency("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workspaces</h2>
          <p className="text-muted-foreground">
            Gestioná tus workspaces y miembros.
          </p>
        </div>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tenés workspaces todavía.</p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Crear workspace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {workspaces.map((workspace) => (
            <AccordionItem key={workspace.id} value={workspace.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  {workspace.type === "PERSONAL" ? (
                    <Home className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{workspace.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {workspace.type === "PERSONAL" ? "Personal" : "Negocio"} • {workspace.memberCount} miembro{workspace.memberCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                {editingId === workspace.id ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${workspace.id}`}>Nombre</Label>
                        <Input
                          id={`name-${workspace.id}`}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Mi Negocio"
                        />
                      </div>
                      {workspace.type === "BUSINESS" && (
                        <div className="space-y-2">
                          <Label htmlFor={`currency-${workspace.id}`}>Moneda</Label>
                          <Input
                            id={`currency-${workspace.id}`}
                            value={editCurrency}
                            onChange={(e) => setEditCurrency(e.target.value)}
                            placeholder="CLP"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleSaveEdit(workspace.id)} disabled={isSaving}>
                        {isSaving ? "Guardando..." : "Guardar"}
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-4">
                    {/* Info */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Información</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Moneda</p>
                            <p className="font-medium">{workspace.currency}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleStartEdit(workspace)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Members (only for BUSINESS) */}
                    {workspace.type === "BUSINESS" && (
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Miembros</CardTitle>
                            {workspace.role === "OWNER" && (
                              <Button variant="outline" size="sm">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Invitar
                              </Button>
                            )}
                          </div>
                          <CardDescription>
                            Personas con acceso a este workspace.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {workspace.members.map((member) => (
                              <div
                                key={member.userId}
                                className="flex items-center justify-between p-2 rounded border"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-medium text-primary">
                                      {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {member.user.name || member.user.email}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Mail className="h-3 w-3" />
                                      <span>{member.user.email}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                    {member.role === "OWNER" ? "Propietario" : member.role === "ADMIN" ? "Admin" : "Miembro"}
                                  </span>
                                  {member.role !== "OWNER" && workspace.role === "OWNER" && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="text-destructive">
                                          Eliminar miembro
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Danger Zone */}
                    {workspace.type === "BUSINESS" && workspace.role === "OWNER" && (
                      <Card className="border-destructive">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-destructive">Zona de peligro</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm">Eliminar workspace</p>
                              <p className="text-xs text-muted-foreground">
                                Esta acción es irreversible.
                              </p>
                            </div>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Create new workspace card */}
      <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Button variant="ghost" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Crear workspace</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
