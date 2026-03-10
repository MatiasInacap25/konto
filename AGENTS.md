# AGENTS.md - Konto Finance Manager

Guidelines for AI agents working in this Next.js 16 + Supabase + Prisma codebase.

## Quick Reference

```bash
npm run dev              # Start dev server (Turbopack)
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint
npx tsc --noEmit        # Type check without building
npx prisma generate     # Regenerate Prisma client
npx prisma db push      # Push schema to database
npx prisma studio       # Open Prisma Studio
```

**No test framework configured yet.** When adding tests, use Vitest or Bun for single test: `bun test path/to/test.spec.ts`.

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
├── actions/           # Server Actions ("use server")
├── app/               # Next.js App Router
│   ├── (auth)/        # Auth pages (login, register)
│   ├── (protected)/   # Protected pages (dashboard)
│   └── auth/          # API routes (OAuth callback)
├── components/
│   ├── dashboard/     # Dashboard components
│   ├── landing/       # Landing page sections
│   ├── shared/        # Shared components
│   └── ui/            # shadcn/ui primitives (DO NOT EDIT)
├── hooks/             # Custom React hooks (use-{name}.ts)
├── lib/
│   ├── validations/   # Zod schemas
│   ├── supabase/     # Supabase clients
│   └── prisma.ts     # Prisma singleton
└── types/             # TypeScript types
```

---

## Code Style

### Naming Conventions
- **Files**: kebab-case (`plan-gate.tsx`, `use-plan.ts`)
- **Components**: PascalCase (`Sidebar`, `PlanGate`)
- **Hooks**: `use-{name}.ts`
- **Variables/Functions**: camelCase (`handleSubmit`, `createClient`)
- **Constants**: SCREAMING_SNAKE_CASE (`PLAN_LIMITS`)
- **Types**: `{ComponentName}Props`, use `type` not `interface`

### Imports Order
1. React/Next.js
2. External libraries (Supabase, Prisma, Lucide)
3. Internal `@/` imports
4. Relative imports

```typescript
import { useState } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
```

### Exports
- **Named exports only** (no default exports)
- Use barrel exports in `index.ts` files

---

## Server vs Client Components

**Server Components** (default): No directive, use `async` for data fetching, access Prisma and env vars directly.

**Client Components**: Add `"use client"` at file top. Required for hooks, useState, event handlers, browser APIs.

```tsx
// Server
export default async function DashboardPage() {
  const user = await prisma.user.findUnique({ where: { id } });
  return <div>{user?.name}</div>;
}

// Client
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
  data = await prisma.user.findUnique({ where: { id } });
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
- Import from `@/lib/prisma` (singleton)
- Use `React.cache()` for per-request memoization

### Zod Validation
- Schemas in `lib/validations/{feature}.ts`
- Export types with `z.infer<typeof schema>`
- Use `safeParse` in Server Actions

### shadcn/ui
- Use `cn()` from `@/lib/utils` for className merging
- Install: `npx shadcn@latest add [component]`
- **Never edit files in `src/components/ui/`**

### Loading States
**MANDATORY**: All pages in `(protected)/` MUST use Skeleton loading states with Suspense.

---

## Language & Copy

- **UI text**: Spanish (Rioplatense - Argentina/Chile), use "vos" forms: "Creá", "Agregá"
- **Code**: English (variables, functions, comments)

---

## Do NOT

- Edit files in `src/components/ui/` (shadcn primitives)
- Use default exports
- Skip `"use client"` when using hooks
- Use `interface` (prefer `type`)
- Commit `.env` files

---

## Agent Skills

Check `.agents/skills/` for specialized guidance:
- `vercel-react-best-practices/` - Performance patterns
- `brainstorming/` - Feature design workflow
- `interface-design/` - UI/UX patterns
