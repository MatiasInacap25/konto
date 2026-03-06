import type { WorkspaceType } from "@prisma/client";

export type WorkspaceWithCounts = {
  id: string;
  name: string;
  type: WorkspaceType;
  currency: string;
  createdAt: Date;
  _count: {
    accounts: number;
    members: number;
    Recurrings: number;
    taxRules: number;
  };
};
