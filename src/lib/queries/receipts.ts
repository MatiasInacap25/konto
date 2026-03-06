import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/queries";
import type { ExtractedReceiptData } from "@/lib/validations/receipt";
import type { AccountOption, CategoryOption } from "@/types/transactions";

export type ReceiptStatusType =
  | "PENDING"
  | "PROCESSING"
  | "EXTRACTED"
  | "COMPLETED"
  | "FAILED";

export type ReceiptItem = {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  status: ReceiptStatusType;
  extractedData: ExtractedReceiptData | null;
  aiError: string | null;
  transactionId: string | null;
  createdAt: Date;
};

/**
 * Get all receipts for a workspace, ordered by most recent first.
 */
export const getReceipts = cache(
  async (workspaceId: string): Promise<ReceiptItem[]> => {
    const user = await getUser();
    if (!user) return [];

    const receipts = await prisma.receipt.findMany({
      where: {
        workspaceId,
        workspace: { userId: user.id },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileUrl: true,
        fileName: true,
        fileType: true,
        status: true,
        extractedData: true,
        aiError: true,
        transactionId: true,
        createdAt: true,
      },
    });

    return receipts.map((r) => ({
      ...r,
      extractedData: r.extractedData as ExtractedReceiptData | null,
    }));
  }
);

/**
 * Get all data needed for the receipts page:
 * workspace info, receipts, accounts, and categories.
 * Uses parallel fetching for performance.
 */
export const getReceiptsPageData = cache(
  async (userId: string, workspaceId?: string) => {
    const workspace = await getWorkspace(userId, workspaceId);
    if (!workspace) return null;

    const [receipts, accounts, categories] = await Promise.all([
      prisma.receipt.findMany({
        where: {
          workspaceId: workspace.id,
          workspace: { userId },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fileUrl: true,
          fileName: true,
          fileType: true,
          status: true,
          extractedData: true,
          aiError: true,
          transactionId: true,
          createdAt: true,
        },
      }),
      prisma.account.findMany({
        where: {
          workspaceId: workspace.id,
          OR: [{ archivedAt: null }, { isSystem: true }],
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        where: {
          OR: [{ userId }, { userId: null }],
        },
        select: { id: true, name: true, type: true, icon: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      workspace,
      receipts: receipts.map((r) => ({
        ...r,
        extractedData: r.extractedData as ExtractedReceiptData | null,
      })) as ReceiptItem[],
      accounts: accounts as AccountOption[],
      categories: categories as CategoryOption[],
    };
  }
);
