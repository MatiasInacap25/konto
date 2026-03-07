# Budget System Design

**Fecha**: 2026-03-07  
**Estado**: Diseño completo - Pendiente implementación

---

## Visión General

Un presupuesto es un **límite de gasto** que el usuario define para un período específico. Cada workspace puede tener múltiples presupuestos activos simultáneamente (ej: presupuesto mensual recurrente + presupuesto especial para vacaciones).

### Características Principales

1. **Períodos personalizables**: Mensual, trimestral, anual, o rango custom (ej: "1-15 Marzo" para quincena)
2. **Dos niveles de control**:
   - Presupuesto total del workspace (obligatorio)
   - Límites por categoría (opcionales)
3. **Múltiples presupuestos simultáneos**: Un workspace puede tener varios presupuestos corriendo al mismo tiempo
4. **Solo trackea EXPENSE**: Las transferencias internas y los ingresos no cuentan
5. **Indicadores visuales**: Barras de progreso con colores (verde < 70%, amarillo 70-90%, rojo > 90%)
6. **Sin rollover**: Cada período es independiente, pero se muestra ahorro histórico en insights

### Casos de Uso

- **Presupuesto mensual recurrente**: "Gastos totales: max $500.000/mes, Transporte: max $50.000"
- **Presupuesto de evento**: "Vacaciones Enero 15-30: max $800.000 total"
- **Presupuesto por proyecto**: "Remodelación Q1 2026: max $2.000.000, Materiales: max $1.200.000"

---

## Modelo de Datos

### Budget (Presupuesto)

```prisma
model Budget {
  id           String      @id @default(cuid())
  name         String      // "Presupuesto Febrero", "Vacaciones Verano"
  totalAmount  Decimal     @db.Decimal(15, 2) // Límite total obligatorio
  
  // Período
  startDate    DateTime    // Inicio del período
  endDate      DateTime    // Fin del período
  
  // Relaciones
  workspaceId  String
  workspace    Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  categoryLimits BudgetCategoryLimit[]
  
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  @@index([workspaceId])
  @@index([startDate, endDate]) // Para queries de períodos activos
}
```

### BudgetCategoryLimit (Límites por Categoría)

```prisma
model BudgetCategoryLimit {
  id          String   @id @default(cuid())
  amount      Decimal  @db.Decimal(15, 2) // Límite para esta categoría
  
  budgetId    String
  budget      Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([budgetId, categoryId]) // Una categoría solo puede tener un límite por presupuesto
  @@index([budgetId])
}
```

### Relaciones con Modelos Existentes

- `Workspace` → `budgets: Budget[]`
- `Category` → `budgetLimits: BudgetCategoryLimit[]`

**Nota importante**: No guardamos el gasto actual en la DB. Se calcula on-demand sumando las transacciones tipo EXPENSE en el rango de fechas del presupuesto. Esto evita inconsistencias y mantiene los datos como "single source of truth".

---

## Cálculo y Queries

### Cálculo de Gasto Actual

Para cada presupuesto, calculamos el gasto en tiempo real:

```typescript
// Gasto total del presupuesto
const totalSpent = await prisma.transaction.aggregate({
  where: {
    workspaceId: budget.workspaceId,
    type: "EXPENSE",
    date: { gte: budget.startDate, lte: budget.endDate }
  },
  _sum: { amount: true }
});

// Gasto por categoría (para límites específicos)
const categorySpent = await prisma.transaction.groupBy({
  by: ["categoryId"],
  where: {
    workspaceId: budget.workspaceId,
    type: "EXPENSE",
    date: { gte: budget.startDate, lte: budget.endDate },
    categoryId: { in: categoryIdsWithLimits }
  },
  _sum: { amount: true }
});
```

### Query Principal: Presupuestos Activos

```typescript
async function getActiveBudgets(workspaceId: string, date: Date = new Date()) {
  return prisma.budget.findMany({
    where: {
      workspaceId,
      startDate: { lte: date },
      endDate: { gte: date }
    },
    include: {
      categoryLimits: {
        include: { category: true }
      }
    },
    orderBy: { startDate: 'desc' }
  });
}
```

### Indicadores de Estado

Porcentaje gastado = `(spent / limit) * 100`

- **Verde**: < 70%
- **Amarillo**: 70% - 90%
- **Rojo**: > 90%
- **Sobrepasado**: > 100%

### Performance

Los cálculos se cachean usando `React.cache()` en el servidor para evitar queries repetidas durante el mismo render.

---

## UI y Navegación

### Nueva Página: `/budgets`

Accesible desde el sidebar con ícono `Target` o `PieChart`. Muestra:

1. **Header**: Título + botón "Crear Presupuesto"
2. **Lista de presupuestos activos** (cards con progress bars)
3. **Tabs**: "Activos" | "Finalizados" | "Todos"

### Budget Card (Tarjeta de Presupuesto)

Muestra para cada presupuesto:

- **Nombre** y **período** (ej: "Febrero 2026" o "15 Ene - 30 Ene")
- **Barra de progreso total**: `$450.000 / $500.000` (90% - amarillo)
- **Desglose de categorías con límite** (si existen):
  - Transporte: `$45.000 / $50.000` (90% - amarillo)
  - Alimentación: `$120.000 / $150.000` (80% - amarillo)
- **Categorías sin límite**: Se muestra suma total como info, sin barra
- **Acciones**: Editar | Eliminar (dropdown menu)

### Formulario: Crear/Editar Presupuesto (Sheet)

Campos:
1. **Nombre** (texto)
2. **Presupuesto total** (número con formato chileno)
3. **Período**: 
   - Selector rápido: "Este mes" | "Próximo mes" | "Este trimestre" | "Custom"
   - Si custom: date range picker
4. **Límites por categoría** (opcional):
   - Lista de categorías tipo EXPENSE
   - Checkbox + input de monto para cada una
   - Solo se guardan las que tienen monto

### Dashboard Integration

Widget opcional en dashboard mostrando presupuesto mensual activo (si existe) con progress bar compacto.

---

## Validaciones y Edge Cases

### Validaciones con Zod

```typescript
const budgetSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  totalAmount: z.string().refine(
    (val) => parseAmount(val) > 0,
    "El monto debe ser mayor a cero"
  ),
  startDate: z.date(),
  endDate: z.date(),
  categoryLimits: z.array(z.object({
    categoryId: z.string(),
    amount: z.string().refine((val) => parseAmount(val) > 0)
  })).optional()
}).refine(
  (data) => data.endDate > data.startDate,
  { message: "La fecha de fin debe ser después del inicio", path: ["endDate"] }
);
```

### Validaciones de Negocio

1. **Suma de límites de categoría ≤ total**: 
   - Warning (no bloqueante): "La suma de límites por categoría ($600k) excede el total ($500k)"
   
2. **Períodos superpuestos**:
   - Permitido (puedes tener presupuesto mensual + presupuesto especial simultáneos)
   - UI muestra ambos si están activos

3. **Eliminar presupuesto**:
   - Confirmación: "¿Eliminar presupuesto? No se borrarán las transacciones."
   - Cascade delete de `BudgetCategoryLimit`

### Edge Cases

- **Categoría eliminada**: Si se elimina una categoría con límite, el `BudgetCategoryLimit` se elimina automáticamente (cascade)
- **Sin transacciones**: Muestra 0% gastado, barra verde
- **Presupuesto vencido**: Se muestra en tab "Finalizados", con estado final (ej: "Gastaste $450k de $500k")
- **Timezone**: Todas las fechas se manejan en timezone local del navegador

---

## Estructura de Archivos

### Database & Types

```
prisma/schema.prisma              # Agregar Budget y BudgetCategoryLimit
src/types/budgets.ts              # TypeScript types
src/lib/validations/budgets.ts    # Zod schemas
src/lib/queries/budgets.ts        # Query functions (getActiveBudgets, etc.)
```

### Server Actions

```
src/actions/budgets.ts            # createBudget, updateBudget, deleteBudget
```

### UI Components

```
src/components/budgets/
├── budgets-client.tsx            # Main orchestrator (client component)
├── budget-card.tsx               # Tarjeta individual con progress bars
├── budget-sheet.tsx              # Formulario crear/editar (Sheet)
├── budget-progress.tsx           # Barra de progreso reutilizable
├── page-skeleton.tsx             # Loading state
└── index.ts                      # Barrel exports
```

### Pages

```
src/app/(protected)/budgets/
└── page.tsx                      # Server component, fetch data
```

### Dashboard Widget (opcional)

```
src/components/dashboard/budget-widget.tsx  # Mini card para dashboard
```

---

## Patrón de Implementación

### Orden de Desarrollo

1. **Prisma schema** → `npx prisma db push` → `npx prisma generate`
2. **Types & Validations** → Zod schemas + TypeScript types
3. **Queries** → Funciones de lectura con `React.cache()`
4. **Actions** → Server actions con validación
5. **UI Components** → Bottom-up (progress bar → card → sheet → page)
6. **Navigation** → Agregar link en sidebar
7. **Testing manual** → Crear presupuesto, agregar transacciones, ver progreso

### Consideraciones de Performance

- Usar `Suspense` con `PageSkeleton` en la página principal
- Cachear queries con `React.cache()`
- Index en `[workspaceId]` y `[startDate, endDate]` para queries rápidas

---

## Decisiones de Diseño

### ¿Por qué múltiples presupuestos por workspace?
Permite tener un presupuesto mensual habitual + presupuestos especiales para eventos sin crear workspaces adicionales.

### ¿Por qué sin rollover automático?
Mantiene los presupuestos simples (siempre el mismo monto) y predecibles. El ahorro se muestra en insights históricos.

### ¿Por qué categorías opcionales?
YAGNI - La mayoría de usuarios solo quiere límites en 2-3 categorías problemáticas, no en todas.

### ¿Por qué solo indicadores visuales (sin emails)?
Simplicidad inicial. Las notificaciones pueden agregarse después si hay demanda real.

### ¿Por qué calcular gasto on-demand en vez de guardarlo?
Single source of truth. Evita inconsistencias y simplifica la lógica (no hay que actualizar contadores en cada transacción).

---

## Próximos Pasos

1. Crear worktree aislado para desarrollo: `git worktree add ../budgets-feature`
2. Implementar siguiendo el patrón establecido
3. Testing manual exhaustivo
4. Considerar agregar a dashboard como widget
5. Evaluar feedback de usuarios para features futuras (emails, rollover, etc.)
