# AGENTS.md - Konto Finance Manager

Guidelines for AI agents working in this Next.js 16 + Supabase + Prisma codebase.

## Quick Reference

```bash
npm run dev              # Start dev server (Turbopack)
npm run build           # Production build
npm run lint            # Run ESLint
npx tsc --noEmit        # Type check without building
npx prisma generate     # Regenerate Prisma client
npx prisma db push      # Push schema to database (dev)
npx prisma studio       # Open Prisma Studio
```

**No test framework configured yet.**

---

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router, React 19, Turbopack)
- **Database**: Supabase PostgreSQL + Prisma ORM
- **Auth**: Supabase Auth (email/password + OAuth)
- **UI**: shadcn/ui (new-york style) + Tailwind CSS 4 + Lucide icons
- **Language**: TypeScript (strict mode)
- **Validation**: Zod

---

## Project Structure

```
src/
├── actions/         # Server Actions ("use server")
├── app/
│   ├── (auth)/      # Auth pages (login, register)
│   ├── (protected)/ # Protected pages (dashboard, etc.)
│   ├── auth/        # API routes (OAuth callback)
│   └── page.tsx     # Landing page
├── components/
│   ├── dashboard/   # Dashboard components
│   ├── landing/     # Landing page sections
│   ├── shared/      # Shared components
│   └── ui/          # shadcn/ui primitives (DO NOT EDIT)
├── hooks/           # Custom React hooks
├── lib/             # Utilities, clients, configs
│   ├── validations/ # Zod schemas
│   └── supabase/    # Supabase clients
└── types/           # TypeScript type definitions
```

---

## Code Style Guidelines

### File Naming
- **kebab-case** for all files: `plan-gate.tsx`, `use-plan.ts`
- Hooks: `use-{name}.ts`
- Types: `{name}.ts` in `/types`

### Component Naming
- **PascalCase**: `Sidebar`, `PlanGate`
- **Named exports only** (no default exports)
- Barrel exports in `index.ts` files

### Variables & Functions
- **camelCase**: `handleSubmit`, `createClient`
- **SCREAMING_SNAKE_CASE** for constants: `PLAN_LIMITS`

### Types
- Use `type` keyword (not `interface`)
- Props type naming: `{ComponentName}Props`

```typescript
type HeaderProps = {
  user: { email: string; name?: string | null };
};

export function Header({ user }: HeaderProps) { ... }
```

---

## Import Order

1. React/Next.js imports
2. External libraries (Supabase, Prisma, Lucide, etc.)
3. Internal `@/` imports (components, lib, hooks, types)
4. Relative imports (use sparingly)

```typescript
import { useState } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
```

---

## Server vs Client Components

### Server Components (default)
- No directive needed
- Use `async` functions for data fetching
- Access Prisma, server-side Supabase, env vars directly

```typescript
export default async function DashboardPage() {
  const supabase = await createClient();
  const dbUser = await prisma.user.findUnique({ ... });
  return <div>...</div>;
}
```

### Client Components
- Add `"use client"` at file top
- Required for: hooks, useState, event handlers, browser APIs
- Keep small and leaf-level when possible

```typescript
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

---

## Error Handling

### Server Actions
Return error objects, don't throw:

```typescript
"use server";

type ActionResult = { success: boolean; error?: string; data?: { id: string } };

export async function createAccount(input: Data): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "No autenticado" };
    
    const validated = schema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message };
    }
    
    // ... create logic
    return { success: true, data: { id: account.id } };
  } catch (error) {
    console.error("Create account failed:", error);
    return { success: false, error: "Error al crear cuenta" };
  }
}
```

### Data Fetching
Use try-catch with fallback values:

```typescript
let data = null;
try {
  data = await prisma.user.findUnique({ ... });
} catch (error) {
  console.error("Failed to fetch:", error);
}
```

---

## Key Patterns

### Supabase Client
- **Server**: `import { createClient } from "@/lib/supabase/server"`
- **Client**: `import { createClient } from "@/lib/supabase/client"`

### Prisma
- Import from `@/lib/prisma` (singleton pattern)
- Use `React.cache()` for per-request memoization

### Zod Validation
- Place schemas in `lib/validations/{feature}.ts`
- Export types with `z.infer<typeof schema>`
- Use `safeParse` in Server Actions

### shadcn/ui
- Use `cn()` for className merging
- Install: `npx shadcn@latest add [component]`
- **Never edit files in `src/components/ui/`**

```typescript
import { cn } from "@/lib/utils";
<div className={cn("base-class", isActive && "active-class")} />
```

### Loading States (Skeletons)

**MANDATORY**: All pages in `(protected)/` MUST use Skeleton loading states.

```typescript
import { Suspense } from "react";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";

export default async function Page({ searchParams }) {
  const params = await searchParams;
  return (
    <Suspense key={params.workspace} fallback={<PageSkeleton />}>
      <PageContent workspaceId={params.workspace} />
    </Suspense>
  );
}
```

---

## Language & Copy

- **UI text**: Spanish (Rioplatense - Argentina/Chile)
- **Code**: English (variables, functions, comments when technical)
- Use "vos" forms: "Creá", "Agregá", "Configurá"

---

## Do NOT

- Edit files in `src/components/ui/` (shadcn primitives)
- Use default exports
- Mix Spanish/English inconsistently
- Skip `"use client"` when using hooks
- Use `interface` (prefer `type`)
- Commit `.env` files

---

## Agent Skills Available

Check `.agents/skills/` for specialized guidance:
- `vercel-react-best-practices/` - Performance patterns
- `brainstorming/` - Feature design workflow
- `interface-design/` - UI/UX patterns

---

## Future: Workspace Sharing (Not Implemented Yet)

This section documents the planned feature for sharing workspaces with other users.

### Schema Design

```prisma
// Enums
enum MemberRole {
  OWNER      // Propietario: control total, puede eliminar workspace
  ADMIN      // Administrador: gestionar miembros, editar settings
  MEMBER     // Miembro: usar normalmente, sin gestión
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REJECTED
}

enum WorkspaceType {
  PERSONAL   // Solo yo
  BUSINESS  // Negocio/Empresa
  SHARED    // Compartido con otros
}

// Workspace - owned by members, not directly by user
model Workspace {
  id          String            @id @default(cuid())
  name        String
  type        WorkspaceType     @default(PERSONAL)
  currency    String            @default("CLP")
  
  // Relaciones
  members     WorkspaceMember[]
  invitations WorkspaceInvitation[]
  transactions Transaction[]
  accounts     Account[]
  recurrings  Recurring[]
  taxRules    TaxRule[]
  categories  Category[]
  
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

// Miembros del workspace
model WorkspaceMember {
  id        String      @id @default(cuid())
  role      MemberRole  @default(MEMBER)
  joinedAt  DateTime    @default(now())
  
  userId    String      @db.Uuid
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  workspaceId String
  workspace   Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
}

// Invitaciones con email (usar Resend)
model WorkspaceInvitation {
  id          String           @id @default(cuid())
  code        String           @unique @default(cuid())
  email       String           // email del invitado
  role        MemberRole       @default(MEMBER)
  status      InvitationStatus @default(PENDING)
  expiresAt   DateTime         // 7 días por defecto
  createdAt   DateTime         @default(now())
  
  workspaceId String
  workspace   Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  invitedBy   String           @db.Uuid // quién invitó
  inviter     User             @relation(fields: [invitedBy], references: [id])

  @@unique([code, workspaceId])
}

// Category ahora pertenece al workspace (no al user)
model Category {
  id            String          @id @default(cuid())
  name          String
  icon          String?
  type          TransactionType

  userId        String?         @db.Uuid // DEPRECATED: migrate to workspace
  user          User?           @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  workspaceId   String?         // NUEVO: migrate from userId
  workspace     Workspace?      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  transactions  Transaction[]
  recurrings   Recurring[]

  @@unique([name, userId, type])        // DEPRECATED
  @@unique([name, workspaceId, type])   // NUEVO
  @@index([userId])
  @@index([workspaceId])
}
```

### Permissions Matrix

| Acción | OWNER | ADMIN | MEMBER |
|--------|-------|-------|--------|
| Ver transacciones | ✅ | ✅ | ✅ |
| Crear transacciones | ✅ | ✅ | ✅ |
| Editar cuenta | ✅ | ✅ | ❌ |
| Eliminar transacciones | ✅ | ✅ | ❌ |
| Invitar miembros | ✅ | ✅ | ❌ |
| Eliminar miembros | ✅ | ✅ | ❌ |
| Eliminar workspace | ✅ | ❌ | ❌ |
| Cambiar settings | ✅ | ✅ | ❌ |
| Eliminar cuenta propia | ✅ | ❌ | ❌ |

### Key Decisions

1. **Email invitations via Resend**: Generate unique code, send email with link
2. **Categories are workspace-scoped**: Each workspace has its own categories
3. **Owner cannot leave**: Must transfer ownership to another member first
4. **Categories migration**: When adding workspaceId to Category, migrate existing user categories

### Implementation Notes

- Use `where: { members: { some: { userId } } }` instead of `where: { userId }`
- Check role before sensitive actions: `if (member.role !== 'OWNER' && member.role !== 'ADMIN') return error`
- Invite link format: `/workspace/invite?code=xxx&workspace=yyy`
- Use Resend API for sending invitation emails
