# STATUS.md - Estado del Proyecto

## Estado Actual: En Desarrollo Activo

Konto es un gestor de finanzas personales y de negocios construido con Next.js 16, Supabase y Prisma. El proyecto se encuentra en fase de desarrollo, con las funcionalidades core implementadas y varias features avanzadas en progreso.

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 16.1.6 | Framework (App Router, React 19, Turbopack) |
| React | 19.2.3 | UI Framework |
| TypeScript | 5.9.3 | Tipado estático (strict mode) |
| Supabase | - | Auth + Database + Storage |
| Prisma | 7.3.0 | ORM |
| Tailwind CSS | 4 | Estilos |
| shadcn/ui | 3.8.4 | Componentes UI |
| Zod | 4.3.6 | Validación de datos |
| Recharts | 3.7.0 | Gráficos |

---

## Schema de Base de Datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              ENUMS                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ Plan              │ STARTER, PRO, BUSINESS                             │
│ TransactionType   │ INCOME, EXPENSE, TRANSFER                          │
│ WorkspaceType     │ PERSONAL, BUSINESS                                 │
│ Frequency         │ WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, SEMI_ANNUALLY│
│                   │ YEARLY                                              │
│ MemberRole        │ OWNER, ADMIN, MEMBER                               │
│ ReceiptStatus     │ PENDING, PROCESSING, EXTRACTED, COMPLETED, FAILED  │
│ GoalStatus        │ ACTIVE, COMPLETED, CANCELLED                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              MODELOS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ User (id: UUID de Supabase Auth)                                       │
│   - id, email, name, avatarUrl, plan                                   │
│   - workspaces[], categories[], memberships[]                         │
│                                                                         │
│ Workspace                                                          │
│   - id, name, type (PERSONAL/BUSINESS), currency (default: CLP)       │
│   - userId (owner)                                                     │
│   - transactions[], accounts[], recurrings[], taxRules[], members[],  │
│     receipts[], savingsGoals[], budgets[]                             │
│                                                                         │
│ Account (balance configurable por workspace)                         │
│   - id, name, balance, isBusiness, archivedAt, isSystem               │
│   - workspaceId                                                        │
│                                                                         │
│ Category (scoped por workspace)                                         │
│   - id, name, icon, type (INCOME/EXPENSE), workspaceId                 │
│                                                                         │
│ Transaction                                                         │
│   - id, amount, date, description, type                             │
│   - taxAmount, taxRate (impuestos opcionales)                         │
│   - workspaceId, accountId, categoryId, receiptUrl                    │
│                                                                         │
│ Recurring (transacciones recurrentes)                                 │
│   - id, name, amount, frequency, nextPayment, isActive, type        │
│   - workspaceId, accountId (optional), categoryId (optional)         │
│                                                                         │
│ TaxRule                                                             │
│   - id, name, percentage, isActive                                     │
│   - workspaceId                                                        │
│                                                                         │
│ WorkspaceMember (para workspaces compartidos)                         │
│   - id, role, joinedAt                                                 │
│   - userId, workspaceId                                                │
│                                                                         │
│ Receipt (extracción de datos por IA)                                  │
│   - id, fileUrl, fileName, fileType, status                           │
│   - extractedData (JSON), aiError                                      │
│   - transactionId (nullable), workspaceId                             │
│                                                                         │
│ SavingsGoal (metas de ahorro)                                         │
│   - id, name, emoji, description, targetAmount, deadline, status      │
│   - accountId (1:1 con Account sistema), workspaceId                 │
│   - completedAt                                                        │
│                                                                         │
│ Budget                                                               │
│   - id, name, totalAmount, startDate, endDate                         │
│   - workspaceId                                                        │
│   - categoryLimits[]                                                  │
│                                                                         │
│ BudgetCategoryLimit                                                  │
│   - id, amount, budgetId, categoryId                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Páginas Implementadas

### Auth (públicas)
- `/login` - Inicio de sesión
- `/register` - Registro de usuario

### Landing
- `/` - Página principal pública

### Dashboard (protegidas)
- `/dashboard` - Vista principal con overview financiero
- `/accounts` - Gestión de cuentas (bancos, tarjetas, efectivo)
- `/transactions` - Registro y listado de transacciones
- `/categories` - Gestión de categorías
- `/recurrings` - Transacciones recurrentes
- `/budgets` - Presupuestos por período
- `/savings` - Metas de ahorro
- `/tax-rules` - Reglas de impuestos
- `/receipts` - Gestión de receipts con extracción IA
- `/reports` - Reportes y gráficos
- `/runway` - Cálculo de runway (meses de operación)
- `/workspaces` - Gestión de workspaces
- `/whatsapp-bot` - Integración con WhatsApp
- `/settings` - Configuración de usuario

---

## Features Principales

### ✅ Implementadas
- Autenticación con Supabase Auth (email/password + OAuth)
- Gestión de workspaces (personal/business)
- CRUD completo de transacciones, cuentas, categorías
- Transacciones recurrentes con frecuencias configurables
- Metas de ahorro con cuentas de sistema asociadas
- Presupuestos con límites por categoría
- Extracción de datos de receipts por IA
- Reportes gráficos con Recharts
- Cálculo de runway financiero

### 🔄 En Progreso
- Sistema de workspaces compartidos (miembros, roles, invitaciones)
- Integración con WhatsApp Bot
- Migración de datos de categorías (de userId a workspaceId)

### 📋 Pendientes
- Tests unitarios y de integración
- Backup/restore de datos
- Exportación a Excel/CSV
- Notificaciones push

---

## Estructura de Archivos Clave

```
src/
├── actions/           # Server Actions (CRUD operations)
├── app/
│   ├── (auth)/        # /login, /register
│   ├── (protected)/   # Todas las páginas protegidas
│   └── page.tsx       # Landing
├── components/
│   ├── dashboard/     # Componentes del dashboard
│   ├── landing/       # Secciones del landing
│   └── ui/            # shadcn/ui (NO EDITAR)
├── hooks/             # Custom hooks
├── lib/
│   ├── prisma.ts      # Cliente Prisma singleton
│   ├── supabase/      # Clientes server/client
│   └── validations/   # Schemas Zod
└── types/             # TypeScript types
```

---

## Notas Importantes

1. **User y Profile fusionados**: El modelo `User` contiene tanto datos de auth como de perfil.
2. **Workspaces**: Todo cuelga del workspace, no del usuario directamente.
3. **Cuentas de sistema**: Las metas de ahorro usan cuentas de sistema (no editables por usuario).
4. **Categorías workspace-scoped**: Cada workspace tiene sus propias categorías.
5. **Receipts**: La extracción de datos es async y usa IA (OpenAI).
6. **Currency**: Cada workspace tiene su propia moneda (default CLP).

---

## Comandos Útiles

```bash
npm run dev              # Dev server
npm run build            # Production build
npm run lint             # ESLint
npx prisma studio        # DB GUI
npx prisma db push       # Push schema
npx prisma generate      # Regenerate client
```
