# Arquitectura Konto - Diseño del Sistema

**Fecha:** 2026-02-11  
**Estado:** Aprobado

---

## 1. Visión General

Konto es una aplicación de gestión financiera para freelancers y emprendedores que permite separar finanzas personales y de negocios en un solo lugar.

### Planes

| Plan | Precio | Target |
|------|--------|--------|
| **Starter** | Gratis | Usuarios que quieren probar |
| **Pro** | $12/mes | Freelancer establecido |
| **Business** | $29/mes | Emprendedor con múltiples negocios |

---

## 2. Estructura de Carpetas

```
src/
├── app/
│   ├── (auth)/                    # Rutas públicas de autenticación
│   │   ├── login/
│   │   └── register/
│   │
│   ├── (protected)/               # Rutas que requieren autenticación
│   │   ├── dashboard/             # Vista principal - adapta según plan
│   │   ├── transactions/          # Ingresos y gastos (todos los planes)
│   │   ├── accounts/              # Cuentas/Cajas (límite en Starter: 2)
│   │   ├── categories/            # Solo Pro+ (Starter: predeterminadas)
│   │   ├── subscriptions/         # Gastos fijos (límite Starter: 5)
│   │   ├── tax-rules/             # Reglas de impuestos (límite Starter: 1)
│   │   ├── workspaces/            # Gestión de workspaces (límite por plan)
│   │   ├── runway/                # Proyección flujo de caja (Solo Pro+)
│   │   ├── receipts/              # Adjuntar recibos (Solo Pro+)
│   │   └── settings/              # Configuración de cuenta
│   │
│   ├── auth/callback/             # Callback OAuth
│   └── page.tsx                   # Landing pública
│
├── components/
│   ├── landing/                   # Componentes de la landing
│   ├── ui/                        # shadcn components
│   ├── dashboard/                 # Componentes del dashboard
│   └── shared/                    # Componentes compartidos
│       └── plan-gate.tsx          # Componente que bloquea por plan
│
├── lib/
│   ├── supabase/                  # Clientes Supabase
│   ├── prisma.ts                  # Cliente Prisma
│   └── plans.ts                   # Configuración de límites por plan
│
├── hooks/
│   └── use-plan.ts                # Hook para verificar plan del usuario
│
└── types/
    └── plans.ts                   # Tipos de planes
```

---

## 3. Modelo de Datos

### Diagrama de Relaciones

```
Profile (1) ──────< Workspace (N)
                        │
        ┌───────────────┼───────────────┐───────────────┐
        │               │               │               │
        ▼               ▼               ▼               ▼
   Account (N)    Category (N)   Subscription (N)  TaxRule (N)
        │               │
        └───────┬───────┘
                ▼
         Transaction (N)
```

### Entidades

#### Profile
- `id` (UUID) - Mismo ID que auth.users de Supabase
- `email` (String)
- `fullName` (String?)
- `avatarUrl` (String?)
- `plan` (Enum: STARTER | PRO | BUSINESS)
- `createdAt`, `updatedAt`

#### Workspace
- `id` (UUID)
- `name` (String)
- `type` (Enum: PERSONAL | BUSINESS)
- `profileId` (FK → Profile)

#### Account
- `id` (UUID)
- `name` (String)
- `type` (String: bank, cash, paypal, crypto, credit_card)
- `balance` (Decimal)
- `workspaceId` (FK → Workspace)

#### Category
- `id` (UUID)
- `name` (String)
- `icon` (String?)
- `isDefault` (Boolean) - Predeterminada del sistema
- `workspaceId` (FK → Workspace)

#### Transaction
- `id` (UUID)
- `type` (Enum: INCOME | EXPENSE)
- `amount` (Decimal)
- `description` (String?)
- `date` (DateTime)
- `receiptUrl` (String?) - Solo Pro+
- `workspaceId` (FK → Workspace)
- `accountId` (FK → Account)
- `categoryId` (FK → Category?)

#### Subscription
- `id` (UUID)
- `name` (String)
- `amount` (Decimal)
- `frequency` (String: monthly, yearly, weekly)
- `nextDueDate` (DateTime)
- `isActive` (Boolean)
- `workspaceId` (FK → Workspace)

#### TaxRule
- `id` (UUID)
- `name` (String: IVA, Impuesto a la Renta, Ahorro, etc.)
- `percentage` (Decimal)
- `workspaceId` (FK → Workspace)

---

## 4. Límites por Plan

```typescript
const PLAN_LIMITS = {
  STARTER: {
    workspaces: { personal: 1, business: 1 },
    accountsPerWorkspace: 2,
    subscriptions: 5,
    taxRulesPerWorkspace: 1,
    customCategories: false,
    runway: false,
    receipts: false,
    whatsappBot: false,
  },
  PRO: {
    workspaces: { personal: 1, business: 3 },
    accountsPerWorkspace: Infinity,
    subscriptions: Infinity,
    taxRulesPerWorkspace: Infinity,
    customCategories: true,
    runway: true,
    receipts: true,
    whatsappBot: false,
  },
  BUSINESS: {
    workspaces: { personal: 1, business: 10 },
    accountsPerWorkspace: Infinity,
    subscriptions: Infinity,
    taxRulesPerWorkspace: Infinity,
    customCategories: true,
    runway: true,
    receipts: true,
    whatsappBot: true,
  },
};
```

---

## 5. Control de Acceso

### Jerarquía de Planes

```
BUSINESS > PRO > STARTER
```

Un usuario con plan superior tiene acceso a todas las features de planes inferiores.

### Componente PlanGate

```tsx
<PlanGate requiredPlan="PRO">
  <RunwayChart />
</PlanGate>
```

- Si el usuario tiene acceso → muestra el contenido
- Si no tiene acceso → muestra prompt de upgrade

### Validación en Server Actions

Antes de crear cualquier recurso, validar:
1. El usuario tiene acceso a la feature
2. No ha alcanzado el límite de su plan

---

## 6. Navegación (Sidebar)

| Sección | Plan Requerido | Límite |
|---------|---------------|--------|
| Dashboard | Todos | - |
| Transacciones | Todos | - |
| Cuentas | Todos | 2 en Starter |
| Suscripciones | Todos | 5 en Starter |
| Workspaces | Todos | 1+1 Starter, 1+3 Pro, 1+10 Business |
| Categorías | Pro+ | - |
| Reglas de Impuestos | Todos | 1 en Starter |
| Proyección (Runway) | Pro+ | - |
| Recibos | Pro+ | - |
| WhatsApp Bot | Business | - |

### Estados Visuales

- **Disponible:** Normal, clickeable
- **Bloqueado por plan:** Opacidad reducida + ícono candado
- **Límite alcanzado:** Badge con contador (ej: "2/2")

---

## 7. Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **Base de datos:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **Autenticación:** Supabase Auth
- **UI:** shadcn/ui + Tailwind CSS
- **Estado:** React Server Components + Server Actions

---

## 8. Próximos Pasos

1. ✅ Diseño de arquitectura
2. ⏳ Implementar estructura de carpetas
3. ⏳ Actualizar schema Prisma
4. ⏳ Crear `PLAN_LIMITS` y `PlanGate`
5. ⏳ Crear layout del dashboard con sidebar
6. ⏳ Implementar páginas por funcionalidad
