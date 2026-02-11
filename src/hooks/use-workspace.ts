"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { WorkspaceType } from "@/types/plans";

export type Workspace = {
  id: string;
  name: string;
  type: WorkspaceType;
  currency: string;
};

type WorkspaceState = {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Hook para manejar el workspace activo.
 * 
 * - Lee el workspace de la URL (?workspace=id)
 * - Si no hay param, redirige al workspace Personal
 * - Provee función para cambiar de workspace
 * 
 * @example
 * ```tsx
 * const { activeWorkspace, workspaces, switchWorkspace, isLoading } = useWorkspace();
 * 
 * // Cambiar workspace
 * switchWorkspace(workspaceId);
 * ```
 */
export function useWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const workspaceIdFromUrl = searchParams.get("workspace");

  const [state, setState] = useState<WorkspaceState>({
    workspaces: [],
    activeWorkspace: null,
    isLoading: true,
    error: null,
  });

  // Cargar workspaces del usuario
  useEffect(() => {
    const supabase = createClient();

    async function fetchWorkspaces() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        if (!user) throw new Error("No authenticated user");

        // Obtener workspaces del usuario
        const { data: workspacesData, error: dbError } = await supabase
          .from("Workspace")
          .select("id, name, type, currency")
          .eq("userId", user.id)
          .order("type", { ascending: true }) // PERSONAL primero
          .order("name", { ascending: true });

        if (dbError) {
          console.error("Supabase error fetching workspaces:", dbError);
          throw dbError;
        }

        console.log("Workspaces fetched:", workspacesData);
        const workspaces = (workspacesData || []) as Workspace[];
        
        // Determinar workspace activo
        let activeWorkspace: Workspace | null = null;
        
        if (workspaceIdFromUrl) {
          // Buscar el workspace de la URL
          activeWorkspace = workspaces.find(w => w.id === workspaceIdFromUrl) || null;
        }
        
        // Si no hay workspace válido en la URL, usar el Personal
        if (!activeWorkspace && workspaces.length > 0) {
          const personalWorkspace = workspaces.find(w => w.type === "PERSONAL");
          activeWorkspace = personalWorkspace || workspaces[0];
          
          // Redirigir a la URL con el workspace
          const params = new URLSearchParams(searchParams.toString());
          params.set("workspace", activeWorkspace.id);
          router.replace(`${pathname}?${params.toString()}`);
        }

        setState({
          workspaces,
          activeWorkspace,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        setState({
          workspaces: [],
          activeWorkspace: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        });
      }
    }

    fetchWorkspaces();
  }, [workspaceIdFromUrl, pathname, router, searchParams]);

  // Función para cambiar de workspace
  const switchWorkspace = useCallback((workspaceId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("workspace", workspaceId);
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  return {
    ...state,
    switchWorkspace,
    workspaceId: state.activeWorkspace?.id || null,
  };
}
