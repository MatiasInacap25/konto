# Recibos con IA — Design Document

**Fecha:** 2026-03-05
**Feature:** Captura inteligente de recibos
**Plan requerido:** PRO

---

## Problema

El usuario quiere crear transacciones a partir de fotos de recibos sin tener que tipear los datos manualmente. Saca foto → la IA extrae los datos → se crea la transacción.

## Decisiones clave

- **Web primero.** El bot de WhatsApp viene después como otro canal de entrada al mismo pipeline.
- **GPT-4o-mini con visión** para la extracción. Buena relación costo/calidad (~$0.003 por imagen).
- **Supabase Storage** para guardar los archivos. Ya estamos en el ecosistema, no tiene sentido meter otro servicio.
- **Revisión por defecto.** El usuario ve un formulario pre-llenado y confirma. Toggle "Crear automáticamente" disponible (OFF por defecto, persiste en localStorage).
- **Solo imágenes en V1** (jpeg, png, webp). PDFs en V2.

## Modelo de datos

```prisma
model Receipt {
  id            String        @id @default(cuid())
  fileUrl       String        // URL en Supabase Storage
  fileName      String        // Nombre original del archivo
  fileType      String        // "image/jpeg", "image/png", etc.
  status        ReceiptStatus @default(PENDING)

  extractedData Json?         // { amount, date, merchant, description, suggestedCategory }
  aiError       String?       // Motivo del fallo si la IA no pudo extraer

  transactionId String?       @unique
  transaction   Transaction?  @relation(fields: [transactionId], references: [id], onDelete: SetNull)

  workspaceId   String
  workspace     Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

enum ReceiptStatus {
  PENDING       // Subido, esperando procesamiento
  PROCESSING    // IA analizando
  EXTRACTED     // Datos extraídos, esperando confirmación
  COMPLETED     // Transacción creada
  FAILED        // Error en extracción
}
```

Un modelo separado de Transaction porque:
- El recibo existe antes de que haya transacción (mientras el usuario revisa).
- Guarda datos crudos de la IA para debugging.
- Los recibos fallidos no ensucian la tabla de transacciones.

## Flujo del usuario

1. Sube imagen en la zona de drag & drop.
2. El archivo se sube a Supabase Storage (`receipts/{workspaceId}/{receiptId}.{ext}`).
3. Se envía a GPT-4o-mini con prompt estructurado.
4. La IA devuelve JSON: `{ amount, date, merchant, description, suggestedCategory }`.
5. **Auto-crear OFF (default):** se abre Sheet lateral con formulario pre-llenado. El usuario revisa, edita, confirma.
6. **Auto-crear ON:** se crea la transacción directamente con badge "Creado por IA".
7. La transacción se crea con `receiptUrl` apuntando al archivo en Storage.

## Componentes

```
src/components/receipts/
├── receipts-client.tsx      # Orquestador principal
├── receipt-uploader.tsx     # Drag & drop + file input
├── receipt-preview.tsx      # Preview imagen + datos extraídos
├── receipt-confirm-form.tsx # Formulario pre-llenado (Sheet lateral)
├── receipt-list.tsx         # Lista de recibos procesados
├── receipt-card.tsx         # Card individual
├── receipts-skeleton.tsx    # Skeleton loading
└── index.ts                 # Barrel export
```

### Estados de la UI

- **Inicial:** Zona de upload + lista de recibos anteriores.
- **Procesando:** Card con spinner, "Analizando recibo..."
- **Extraído (manual):** Sheet con formulario pre-llenado.
- **Extraído (auto):** Card como "completado" con badge.
- **Error:** Card con error + botón reintentar.

## Server Actions

```
src/actions/receipts.ts
├── uploadReceipt()    # Sube a Storage + crea Receipt PENDING + llama processReceipt
├── processReceipt()   # Envía a GPT-4o-mini + guarda extractedData
├── confirmReceipt()   # Crea Transaction desde datos extraídos/editados → COMPLETED
├── retryReceipt()     # Re-procesa un recibo FAILED
└── deleteReceipt()    # Elimina recibo + archivo de Storage
```

### uploadReceipt

1. Valida tipo (jpeg, png, webp) y tamaño (max 5MB).
2. Sube a Storage: `receipts/{workspaceId}/{receiptId}.{ext}`.
3. Crea `Receipt` con status `PENDING`.
4. Llama a `processReceipt()`.

### processReceipt

1. Status → `PROCESSING`.
2. Obtiene URL pública del archivo.
3. Envía a OpenAI con prompt + imagen.
4. Parsea JSON + valida con Zod.
5. Guarda `extractedData`, status → `EXTRACTED`.
6. Si autoCreate ON: llama `confirmReceipt()` automáticamente.
7. Si falla: guarda `aiError`, status → `FAILED`.

### confirmReceipt

1. Recibe datos (pueden estar editados).
2. Valida con Zod.
3. Crea `Transaction` con `receiptUrl`.
4. Actualiza `Receipt` con `transactionId`, status → `COMPLETED`.

## OpenAI Integration

```
src/lib/openai.ts         # Cliente singleton
src/lib/validations/receipt.ts  # Zod schemas
```

### Prompt

```
Analizá esta imagen de un recibo/boleta/factura y extraé los siguientes datos.
Respondé SOLO con JSON válido, sin markdown ni explicaciones.

{
  "amount": number,
  "date": "YYYY-MM-DD",
  "merchant": "string",
  "description": "string",
  "suggestedCategory": "string"  // Una de: Alimentación, Transporte, Entretenimiento, Servicios, Herramientas, Hosting/Cloud, Software, Viajes
}

Si no podés extraer algún campo, usá null.
Si no es un recibo o comprobante de pago, respondé: { "error": "No es un recibo válido" }
```

Retry simple: 1 reintento si falla el parseo JSON.

## Futuro (no incluido en V1)

- Soporte PDF (convertir primera página a imagen server-side).
- Bot de WhatsApp como canal de entrada al mismo pipeline.
- Bulk upload (subir varios recibos a la vez).
