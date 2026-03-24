import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceSettingsClient } from "./workspace-settings-client";

async function getWorkspaces() {
  const user = await getUser();
  if (!user) return [];

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    type: m.workspace.type,
    role: m.role,
    currency: m.workspace.currency,
    memberCount: m.workspace.members.length,
    members: m.workspace.members.map((mem) => ({
      userId: mem.userId,
      role: mem.role,
      user: mem.user,
    })),
  }));
}

export async function WorkspaceSettings() {
  const workspaces = await getWorkspaces();

  return <WorkspaceSettingsClient workspaces={workspaces} />;
}
