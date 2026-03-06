"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Building2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceCard } from "./workspace-card";
import type { WorkspaceWithCounts } from "@/types/workspaces";
import { deleteWorkspace } from "@/actions/workspaces";
import { toast } from "sonner";

const WorkspaceSheet = dynamic(
  () =>
    import("./workspace-sheet").then((m) => ({
      default: m.WorkspaceSheet,
    })),
  { ssr: false }
);

const DeleteConfirmModal = dynamic(
  () =>
    import("./delete-confirm-modal").then((m) => ({
      default: m.DeleteConfirmModal,
    })),
  { ssr: false }
);

type WorkspacesClientProps = {
  workspaces: WorkspaceWithCounts[];
};

export function WorkspacesClient({ workspaces }: WorkspacesClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] =
    useState<WorkspaceWithCounts | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceWithCounts | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCreate = () => {
    setEditingWorkspace(null);
    setSheetOpen(true);
  };

  const handleEdit = (workspace: WorkspaceWithCounts) => {
    setEditingWorkspace(workspace);
    setSheetOpen(true);
  };

  const handleDelete = (workspace: WorkspaceWithCounts) => {
    setSelectedWorkspace(workspace);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedWorkspace) return;

    setIsDeleting(true);
    try {
      const result = await deleteWorkspace(selectedWorkspace.id);
      if (result.success) {
        toast.success("Workspace eliminado");
        setDeleteModalOpen(false);
        setSelectedWorkspace(null);
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and separate workspaces in a single pass
  const personalWorkspaces: WorkspaceWithCounts[] = [];
  const businessWorkspaces: WorkspaceWithCounts[] = [];

  for (const ws of workspaces) {
    if (!ws.name.toLowerCase().includes(searchTerm.toLowerCase())) continue;
    if (ws.type === "PERSONAL") {
      personalWorkspaces.push(ws);
    } else {
      businessWorkspaces.push(ws);
    }
  }

  const hasWorkspaces = workspaces.length > 0;
  const hasFilteredWorkspaces = personalWorkspaces.length + businessWorkspaces.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestioná tus espacios de trabajo personales y de negocio
          </p>
        </div>
        <button
          onClick={handleCreate}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-md",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "text-sm font-medium transition-colors"
          )}
        >
          <Plus className="w-4 h-4" />
          Nuevo workspace
        </button>
      </div>

      {/* Search */}
      {hasWorkspaces && workspaces.length > 2 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar workspaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-9 pr-4 py-2 rounded-md border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "text-sm"
              )}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {!hasWorkspaces ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Sin workspaces</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Creá un workspace para organizar tus finanzas personales o de
            negocio.
          </p>
          <button
            onClick={handleCreate}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-md",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "text-sm font-medium transition-colors"
            )}
          >
            <Plus className="w-4 h-4" />
            Crear primer workspace
          </button>
        </div>
      ) : !hasFilteredWorkspaces ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No se encontraron workspaces con ese nombre
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Personal workspaces */}
          {personalWorkspaces.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Personales
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalWorkspaces.map((workspace) => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Business workspaces */}
          {businessWorkspaces.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Negocio
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {businessWorkspaces.map((workspace) => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Sheet — lazy loaded */}
      {sheetOpen && (
        <WorkspaceSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          workspace={editingWorkspace}
        />
      )}

      {/* Delete Modal — lazy loaded */}
      {deleteModalOpen && (
        <DeleteConfirmModal
          open={deleteModalOpen}
          workspace={selectedWorkspace}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedWorkspace(null);
          }}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
