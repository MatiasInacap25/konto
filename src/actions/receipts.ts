"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai";
import { revalidatePath } from "next/cache";
import {
  extractedReceiptDataSchema,
  extractionErrorSchema,
  confirmReceiptSchema,
  parseReceiptAmount,
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/validations/receipt";
import type { ExtractedReceiptData } from "@/lib/validations/receipt";

// ============================================
// Types
// ============================================

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ============================================
// Helpers
// ============================================

async function verifyAccess(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado", user: null, supabase: null };
  }

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId: user.id },
  });

  if (!workspace) {
    return { error: "Workspace no encontrado", user: null, supabase: null };
  }

  return { error: null, user, workspace, supabase };
}

function getFileExtension(fileType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[fileType] || "jpg";
}

// ============================================
// OpenAI extraction
// ============================================

const EXTRACTION_PROMPT = `Analizá esta imagen de un recibo/boleta/factura y extraé los siguientes datos.
Respondé SOLO con JSON válido, sin markdown ni explicaciones.

{
  "amount": number,
  "date": "YYYY-MM-DD",
  "merchant": "string",
  "description": "string",
  "suggestedCategory": "string"
}

Las categorías posibles son: Alimentación, Transporte, Entretenimiento, Servicios, Herramientas, Hosting/Cloud, Software, Viajes.
Elegí la que mejor se ajuste al tipo de gasto del recibo.

Si no podés extraer algún campo, usá null.
Si no es un recibo o comprobante de pago, respondé: { "error": "No es un recibo válido" }`;

async function extractReceiptData(
  imageUrl: string
): Promise<{ data: ExtractedReceiptData | null; error: string | null }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return { data: null, error: "La IA no devolvió respuesta" };
    }

    // Try to parse as JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Retry once — sometimes GPT wraps in markdown
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          return { data: null, error: "No se pudo parsear la respuesta de la IA" };
        }
      } else {
        return { data: null, error: "No se pudo parsear la respuesta de la IA" };
      }
    }

    // Check if it's an error response
    const errorResult = extractionErrorSchema.safeParse(parsed);
    if (errorResult.success) {
      return { data: null, error: errorResult.data.error };
    }

    // Validate as extracted data
    const dataResult = extractedReceiptDataSchema.safeParse(parsed);
    if (!dataResult.success) {
      return {
        data: null,
        error: `Datos inválidos: ${dataResult.error.issues[0]?.message}`,
      };
    }

    return { data: dataResult.data, error: null };
  } catch (error) {
    console.error("OpenAI extraction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error de extracción",
    };
  }
}

// ============================================
// Server Actions
// ============================================

/**
 * Upload a receipt image and create a PENDING record.
 * Returns the receipt ID so the client can then call processReceipt.
 */
export async function uploadReceipt(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const file = formData.get("file") as File | null;
    const workspaceId = formData.get("workspaceId") as string | null;

    if (!file || !workspaceId) {
      return { success: false, error: "Faltan datos requeridos" };
    }

    // Validate file
    if (
      !ACCEPTED_FILE_TYPES.includes(
        file.type as (typeof ACCEPTED_FILE_TYPES)[number]
      )
    ) {
      return {
        success: false,
        error: "Formato no soportado. Usá JPEG, PNG o WebP.",
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "El archivo es demasiado grande. Máximo 5MB.",
      };
    }

    const { error, supabase } = await verifyAccess(workspaceId);
    if (error || !supabase) {
      return { success: false, error: error || "No autorizado" };
    }

    // Generate receipt ID first so we can use it in the path
    const receipt = await prisma.receipt.create({
      data: {
        fileUrl: "", // Will update after upload
        fileName: file.name,
        fileType: file.type,
        status: "PENDING",
        workspaceId,
      },
    });

    // Upload to Supabase Storage
    const ext = getFileExtension(file.type);
    const storagePath = `${workspaceId}/${receipt.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // Clean up the DB record if upload fails
      await prisma.receipt.delete({ where: { id: receipt.id } });
      console.error("Storage upload error:", uploadError);
      return { success: false, error: "Error al subir el archivo" };
    }

    // Get the public URL (signed URL for private bucket)
    const {
      data: { publicUrl },
    } = supabase.storage.from("receipts").getPublicUrl(storagePath);

    // Update the receipt with the file URL
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { fileUrl: publicUrl },
    });

    revalidatePath("/receipts");

    return { success: true, data: { id: receipt.id } };
  } catch (error) {
    console.error("Upload receipt error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Process a receipt with GPT-4o-mini to extract data.
 * Changes status: PENDING → PROCESSING → EXTRACTED or FAILED.
 */
export async function processReceipt(
  receiptId: string,
  workspaceId: string
): Promise<ActionResult<{ extractedData: ExtractedReceiptData | null }>> {
  try {
    const { error, supabase } = await verifyAccess(workspaceId);
    if (error || !supabase) {
      return { success: false, error: error || "No autorizado" };
    }

    // Get the receipt
    const receipt = await prisma.receipt.findFirst({
      where: { id: receiptId, workspaceId },
    });

    if (!receipt) {
      return { success: false, error: "Recibo no encontrado" };
    }

    if (receipt.status !== "PENDING" && receipt.status !== "FAILED") {
      return { success: false, error: "El recibo ya fue procesado" };
    }

    // Update status to PROCESSING
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { status: "PROCESSING", aiError: null },
    });

    // Get a signed URL for the AI to access (private bucket)
    const ext = getFileExtension(receipt.fileType);
    const storagePath = `${workspaceId}/${receiptId}.${ext}`;

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("receipts")
      .createSignedUrl(storagePath, 300); // 5 minutes

    if (signedUrlError || !signedUrlData?.signedUrl) {
      await prisma.receipt.update({
        where: { id: receiptId },
        data: { status: "FAILED", aiError: "No se pudo obtener URL del archivo" },
      });
      return { success: false, error: "No se pudo obtener URL del archivo" };
    }

    // Extract data with AI
    const { data: extractedData, error: aiError } = await extractReceiptData(
      signedUrlData.signedUrl
    );

    if (aiError || !extractedData) {
      await prisma.receipt.update({
        where: { id: receiptId },
        data: {
          status: "FAILED",
          aiError: aiError || "No se pudieron extraer datos",
        },
      });

      revalidatePath("/receipts");

      return {
        success: false,
        error: aiError || "No se pudieron extraer datos",
      };
    }

    // Save extracted data
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        status: "EXTRACTED",
        extractedData: extractedData as object,
        aiError: null,
      },
    });

    revalidatePath("/receipts");

    return { success: true, data: { extractedData } };
  } catch (error) {
    console.error("Process receipt error:", error);

    // Try to update status to FAILED
    try {
      await prisma.receipt.update({
        where: { id: receiptId },
        data: {
          status: "FAILED",
          aiError: error instanceof Error ? error.message : "Error de procesamiento",
        },
      });
    } catch {
      // Ignore cleanup errors
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Confirm a receipt and create a transaction from the extracted/edited data.
 * Changes status: EXTRACTED → COMPLETED.
 */
export async function confirmReceipt(
  input: unknown,
  workspaceId: string
): Promise<ActionResult<{ transactionId: string }>> {
  try {
    // Validate input
    const parsed = confirmReceiptSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Datos inválidos",
      };
    }

    const validInput = parsed.data;

    const { error, supabase } = await verifyAccess(workspaceId);
    if (error || !supabase) {
      return { success: false, error: error || "No autorizado" };
    }

    // Get receipt and account in parallel
    const [receipt, account] = await Promise.all([
      prisma.receipt.findFirst({
        where: { id: validInput.receiptId, workspaceId },
      }),
      prisma.account.findFirst({
        where: { id: validInput.accountId, workspaceId, archivedAt: null },
      }),
    ]);

    if (!receipt) {
      return { success: false, error: "Recibo no encontrado" };
    }

    if (receipt.status !== "EXTRACTED") {
      return {
        success: false,
        error: "El recibo no está listo para confirmar",
      };
    }

    if (!account) {
      return { success: false, error: "Cuenta no encontrada o archivada" };
    }

    const amount = parseReceiptAmount(validInput.amount);

    // Calculate tax if tax rule is provided
    let taxRule = null;
    let taxAmount: number | null = null;
    let taxRate: number | null = null;
    
    if (validInput.taxRuleId) {
      taxRule = await prisma.taxRule.findFirst({
        where: { id: validInput.taxRuleId, workspaceId },
      });
      if (taxRule) {
        taxAmount = amount * (Number(taxRule.percentage) / 100);
        taxRate = Number(taxRule.percentage);
      }
    }

    // Create transaction + update receipt + update account balance in a DB transaction
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount,
          description: validInput.description,
          type: "EXPENSE", // Receipts are always expenses
          scope: validInput.scope,
          date: validInput.date,
          accountId: validInput.accountId,
          categoryId: validInput.categoryId || undefined,
          taxAmount: taxAmount,
          taxRate: taxRate,
          workspaceId,
          receiptUrl: receipt.fileUrl,
        },
      });

      // Update account balance (expense = negative, include tax if present)
      const totalToDeduct = taxAmount ? amount + taxAmount : amount;
      await tx.account.update({
        where: { id: validInput.accountId },
        data: {
          balance: {
            decrement: totalToDeduct,
          },
        },
      });

      // Link receipt to transaction
      await tx.receipt.update({
        where: { id: validInput.receiptId },
        data: {
          status: "COMPLETED",
          transactionId: transaction.id,
        },
      });

      return transaction;
    });

    revalidatePath("/receipts");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true, data: { transactionId: result.id } };
  } catch (error) {
    console.error("Confirm receipt error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Retry processing a FAILED receipt.
 */
export async function retryReceipt(
  receiptId: string,
  workspaceId: string
): Promise<ActionResult<{ extractedData: ExtractedReceiptData | null }>> {
  try {
    const { error } = await verifyAccess(workspaceId);
    if (error) {
      return { success: false, error };
    }

    // Verify the receipt exists and is FAILED
    const receipt = await prisma.receipt.findFirst({
      where: { id: receiptId, workspaceId, status: "FAILED" },
    });

    if (!receipt) {
      return {
        success: false,
        error: "Recibo no encontrado o no se puede reintentar",
      };
    }

    // Reset to PENDING and re-process
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { status: "PENDING", aiError: null },
    });

    return processReceipt(receiptId, workspaceId);
  } catch (error) {
    console.error("Retry receipt error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Delete a receipt and its file from storage.
 * Cannot delete COMPLETED receipts (they have linked transactions).
 */
export async function deleteReceipt(
  receiptId: string,
  workspaceId: string
): Promise<ActionResult> {
  try {
    const { error, supabase } = await verifyAccess(workspaceId);
    if (error || !supabase) {
      return { success: false, error: error || "No autorizado" };
    }

    const receipt = await prisma.receipt.findFirst({
      where: { id: receiptId, workspaceId },
    });

    if (!receipt) {
      return { success: false, error: "Recibo no encontrado" };
    }

    if (receipt.status === "COMPLETED") {
      return {
        success: false,
        error:
          "No se puede eliminar un recibo con transacción asociada. Eliminá la transacción primero.",
      };
    }

    // Delete from storage and DB in parallel
    const ext = getFileExtension(receipt.fileType);
    const storagePath = `${workspaceId}/${receiptId}.${ext}`;

    await Promise.all([
      supabase.storage.from("receipts").remove([storagePath]),
      prisma.receipt.delete({ where: { id: receiptId } }),
    ]);

    revalidatePath("/receipts");

    return { success: true };
  } catch (error) {
    console.error("Delete receipt error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
