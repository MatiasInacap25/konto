# Savings Goals Feature - Design Document

**Date**: 2026-03-06  
**Status**: Approved, Ready for Implementation  
**Author**: AI Agent (with user validation)

---

## Overview

This document outlines the complete design for a **savings goals feature** in Konto. Users can create multiple savings goals (e.g., "Viaje a Europa", "Fondo de emergencia"), contribute money from existing accounts, track progress toward target amounts, and optionally set deadlines.

---

## 1. Data Model

### Architecture Decision: System Account Pattern

Each savings goal is backed by a **system account** (`Account` with `isSystem: true`). This approach:
- ✅ Reuses existing transfer logic — contributing to a goal is just a transfer between accounts
- ✅ Keeps goals visible in transactions and reports automatically
- ✅ Maintains full audit trail (every contribution/withdrawal is a transaction)
- ✅ No special balance tracking needed — use `Account.balance`

### Schema Changes

**New Enum**:
```prisma
enum GoalStatus {
  ACTIVE      // En progreso
  COMPLETED   // Meta alcanzada (balance >= targetAmount)
  CANCELLED   // Cancelado por el usuario
}
```

**New Model**:
```prisma
model SavingsGoal {
  id            String      @id @default(cuid())
  name          String      // "Viaje a Europa", "Fondo de emergencia"
  emoji         String?     // 🏖️, 💰, 🚗
  description   String?     // Texto libre opcional
  targetAmount  Decimal     @db.Decimal(15, 2)
  deadline      DateTime?   // Opcional
  status        GoalStatus  @default(ACTIVE)
  
  // Relación 1:1 con Account (system account)
  accountId     String      @unique
  account       Account     @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  workspaceId   String
  workspace     Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  completedAt   DateTime?   // Timestamp cuando se marcó como COMPLETED

  @@index([workspaceId, status])
}
```

**Account Model Change**:
```prisma
model Account {
  // ... existing fields
  isSystem      Boolean       @default(false)  // ALREADY EXISTS
  savingsGoal   SavingsGoal?  // NEW: reverse relation (1:1)
  // ...
}
```

**Workspace Model Change**:
```prisma
model Workspace {
  // ... existing relations
  savingsGoals  SavingsGoal[]  // NEW
  // ...
}
```

### Migration Strategy

1. Add `GoalStatus` enum
2. Add `SavingsGoal` model with relations
3. Add `savingsGoal` relation to `Account` (optional 1:1)

---

## 2. UI Structure

### Page: `/savings`

**Location**: `src/app/(protected)/savings/page.tsx`

**Layout**:
```
┌─────────────────────────────────────────┐
│ [+ Nueva Meta]            [Filtro ▼]     │ ← Header
├─────────────────────────────────────────┤
│                                         │
│  🏖️ Viaje a Europa                      │
│  $1,500,000 de $3,000,000 (50%)        │
│  ████████░░░░░░░░ (progress bar)        │
│  Plazo: 30 jun 2026 (4 meses)          │
│  ⚠️ Necesitas $500k/mes — vas atrasado │
│  [Aportar] [Retirar] [...]              │
│                                         │
│  💰 Fondo de emergencia                 │
│  $850,000 de $1,000,000 (85%)          │
│  ████████████████░░ (progress bar)      │
│  Sin plazo                              │
│  [Aportar] [Retirar] [...]              │
│                                         │
│  ✅ Auto nuevo (Completado)             │
│  $2,000,000 de $2,000,000 (100%)       │
│  Completado el 15 feb 2026             │
│  [Retirar todo] [...]                   │
│                                         │
└─────────────────────────────────────────┘
```

**Components**:
- `src/components/savings/savings-client.tsx` (client, manages sheet/dialog state)
- `src/components/savings/goal-card.tsx` (client, displays single goal with actions)
- `src/components/savings/goal-sheet.tsx` (client, create/edit form in Sheet)
- `src/components/savings/contribute-dialog.tsx` (client, transfer FROM account TO goal)
- `src/components/savings/withdraw-dialog.tsx` (client, transfer FROM goal TO account)
- `src/components/savings/page-skeleton.tsx` (loading state)
- `src/components/savings/index.ts` (barrel export)

### Sidebar Item

**Location**: `src/components/dashboard/sidebar.tsx`

Add between "Cuentas" and "Reportes":
```tsx
{
  name: "Ahorro",
  href: "/savings",
  icon: PiggyBank,  // from lucide-react
}
```

**No plan gating** — free for all users.

### Dashboard Card

**Location**: `src/app/(protected)/dashboard/page.tsx` + components

New card showing:
- Total saved across all goals: `$2,350,000`
- Number of active goals: `2 metas activas`
- Next deadline (if any): `Próximo: 30 jun 2026`
- Click → navigate to `/savings`

---

## 3. Business Logic

### Create Goal

**Action**: `createSavingsGoal(data: CreateGoalData)`

1. Validate input (Zod schema)
2. Check workspace access
3. Create system account:
   ```ts
   const account = await prisma.account.create({
     data: {
       name: `💰 Meta: ${data.name}`,
       type: "SAVINGS",
       currency: workspace.currency,
       balance: 0,
       isSystem: true,
       workspaceId,
     }
   });
   ```
4. Create goal linked to account:
   ```ts
   const goal = await prisma.savingsGoal.create({
     data: {
       name: data.name,
       emoji: data.emoji,
       description: data.description,
       targetAmount: data.targetAmount,
       deadline: data.deadline,
       accountId: account.id,
       workspaceId,
     }
   });
   ```
5. Return success

**Validations**:
- `targetAmount > 0`
- `deadline` (if set) must be in the future
- `name` is required
- User has access to workspace

### Edit Goal

**Action**: `updateSavingsGoal(goalId: string, data: UpdateGoalData)`

1. Validate input
2. Check workspace access + goal ownership
3. Update goal fields (can edit: name, emoji, description, targetAmount, deadline)
4. **Cannot edit**: status (auto-managed), accountId
5. Return success

**Validations**:
- Same as create
- Cannot edit `COMPLETED` or `CANCELLED` goals

### Delete Goal

**Action**: `deleteSavingsGoal(goalId: string, returnAccountId?: string)`

**Flow**:
1. Check workspace access + goal ownership
2. Check current balance
3. **If balance > 0**:
   - `returnAccountId` is required
   - Create transfer FROM goal TO return account
   - Update goal status to `CANCELLED`
   - Delete goal + system account (cascade)
4. **If balance = 0**:
   - Delete goal + system account directly
5. Return success

**Validations**:
- If `balance > 0`, must provide valid `returnAccountId`
- Return account must belong to same workspace
- Return account cannot be another system account

### Contribute

**Action**: `contributeToGoal(goalId: string, data: ContributeData)`

1. Validate input
2. Check workspace access + goal ownership
3. Check goal is `ACTIVE` (cannot contribute to completed/cancelled)
4. **Create transfer** using existing `transferBetweenAccounts`:
   ```ts
   await transferBetweenAccounts({
     fromAccountId: data.fromAccountId,
     toAccountId: goal.accountId,
     amount: data.amount,
     date: data.date,
     description: `Aporte a meta: ${goal.name}`,
   });
   ```
5. **Auto-complete check**:
   ```ts
   const newBalance = goal.account.balance + data.amount;
   if (newBalance >= goal.targetAmount && goal.status === 'ACTIVE') {
     await prisma.savingsGoal.update({
       where: { id: goalId },
       data: { status: 'COMPLETED', completedAt: new Date() },
     });
   }
   ```
6. Return success

**Validations**:
- `amount > 0`
- `fromAccountId` has sufficient balance
- Goal is `ACTIVE`
- Both accounts belong to same workspace
- Cannot contribute from another system account

### Withdraw

**Action**: `withdrawFromGoal(goalId: string, data: WithdrawData)`

1. Validate input
2. Check workspace access + goal ownership
3. Check goal has sufficient balance
4. **Create transfer** FROM goal TO user account:
   ```ts
   await transferBetweenAccounts({
     fromAccountId: goal.accountId,
     toAccountId: data.toAccountId,
     amount: data.amount,
     date: data.date,
     description: `Retiro de meta: ${goal.name}`,
   });
   ```
5. **Status update**: If goal was `COMPLETED` and new balance < target, revert to `ACTIVE`
6. Return success

**Validations**:
- `amount > 0`
- Goal balance >= amount
- Cannot withdraw to another system account
- Both accounts belong to same workspace

---

## 4. System Integration

### Accounts Page

**Change**: Filter out system accounts from display

```tsx
// src/components/accounts/accounts-client.tsx
const displayAccounts = accounts.filter(acc => !acc.isSystem);
```

**Note**: System accounts (goals) will still appear in:
- Transaction lists (with account name)
- Reports (included in totals)
- Account selectors (excluded via `isSystem: false` filter in queries)

### Transactions

No changes needed — transfers to/from goals appear automatically with account name.

Example:
```
15 mar 2026  Transferencia     -$100,000   Cuenta Corriente
             → 💰 Meta: Viaje a Europa
```

### Reports

No changes needed — goal balances included in "Ahorros" category totals automatically.

### Sidebar

Add new nav item (see section 2).

### Dashboard

Add savings summary card (see section 2).

---

## 5. Code Structure

### Files to Create

#### Schema
- `prisma/schema.prisma` — add `GoalStatus` enum + `SavingsGoal` model + relations

#### Server
- `src/actions/savings.ts` — 5 server actions (create, update, delete, contribute, withdraw)
- `src/lib/queries/savings.ts` — data fetching (getSavingsGoals, getSavingsPageData)
- `src/lib/validations/savings.ts` — Zod schemas (CreateGoalSchema, UpdateGoalSchema, etc.)

#### Types
- `src/types/savings.ts` — GoalItem, CreateGoalData, UpdateGoalData, ContributeData, WithdrawData

#### Components
- `src/components/savings/savings-client.tsx`
- `src/components/savings/goal-card.tsx`
- `src/components/savings/goal-sheet.tsx`
- `src/components/savings/contribute-dialog.tsx`
- `src/components/savings/withdraw-dialog.tsx`
- `src/components/savings/page-skeleton.tsx`
- `src/components/savings/index.ts`

#### Page
- `src/app/(protected)/savings/page.tsx`

### Files to Modify

- `src/components/dashboard/sidebar.tsx` — add "Ahorro" nav item
- `src/app/(protected)/dashboard/page.tsx` — add savings card component
- `src/components/accounts/accounts-client.tsx` — filter `isSystem: false`

### Key Patterns

**Progress calculation**:
```ts
const progress = (currentBalance / targetAmount) * 100;
const progressClamped = Math.min(progress, 100);
```

**Monthly contribution needed** (if deadline set):
```ts
const monthsLeft = differenceInMonths(deadline, new Date());
if (monthsLeft > 0) {
  const remaining = targetAmount - currentBalance;
  const monthlyNeeded = remaining / monthsLeft;
  // Show: "Necesitas $X/mes para cumplir el plazo"
}
```

**On-track status**:
```ts
const expectedProgress = (monthsPassed / totalMonths) * 100;
const isOnTrack = progress >= expectedProgress;
// Show ✅ or ⚠️
```

**Auto-completion**:
```ts
if (newBalance >= goal.targetAmount && goal.status === 'ACTIVE') {
  await prisma.savingsGoal.update({
    where: { id: goalId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
}
```

---

## Implementation Checklist

- [ ] Update Prisma schema
- [ ] Create and apply migration
- [ ] Create validations file
- [ ] Create types file
- [ ] Create server actions
- [ ] Create queries file
- [ ] Create all components
- [ ] Create page
- [ ] Update sidebar
- [ ] Add dashboard card
- [ ] Filter system accounts in accounts page
- [ ] Test all flows (create, contribute, complete, withdraw, delete)
- [ ] Update documentation

---

## Future Enhancements (Not in Scope)

- Recurring auto-contributions (monthly/weekly)
- Goal templates ("Fondo emergencia", "Vacaciones", etc.)
- Charts/graphs for progress over time
- Notifications when goal completed
- Goal sharing/visibility in shared workspaces

---

**End of Design Document**
