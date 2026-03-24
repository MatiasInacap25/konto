"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, UserPlus, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Member = {
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
};

type WorkspaceMembersProps = {
  workspaceId: string;
  members: Member[];
};

export function WorkspaceMembers({ workspaceId, members }: WorkspaceMembersProps) {
  const [isInviting, setIsInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    // Simulate invite - TODO: Connect to actual action
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setEmail("");
    setIsInviting(false);
    setIsSubmitting(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Propietario";
      case "ADMIN":
        return "Administrador";
      case "MEMBER":
        return "Miembro";
      default:
        return role;
    }
  };

  return (
    <div className="space-y-4">
      {/* Invite form */}
      {isInviting ? (
        <form onSubmit={handleInvite} className="flex gap-2">
          <div className="flex-1">
            <Input
              type="email"
              placeholder="Email del miembro"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Invitar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsInviting(false);
              setEmail("");
            }}
          >
            Cancelar
          </Button>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsInviting(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar miembro
        </Button>
      )}

      {/* Members list */}
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {member.user.name || member.user.email}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{member.user.email}</span>
                  <span className="text-primary">•</span>
                  <span>{getRoleLabel(member.role)}</span>
                </div>
              </div>
            </div>

            {member.role !== "OWNER" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}

        {members.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay miembros en este workspace.
          </p>
        )}
      </div>
    </div>
  );
}
