/**
 * Account types for the accounts module
 */

export type AccountType = "BANK" | "CASH" | "DIGITAL" | "CARD" | "INVESTMENT";

export type AccountWithStats = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  isBusiness: boolean;
  isSystem: boolean;
  archivedAt: Date | null;
  lastActivityAt: Date | null;
  transactionCount: number;
};

export type AccountFormData = {
  name: string;
  type: AccountType;
  balance: string;
  isBusiness: boolean;
};

// For the account list display
export type AccountListItem = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  isBusiness: boolean;
  isSystem: boolean;
  archivedAt: Date | null;
  lastActivityAt: Date | null;
};

// Labels for account types in Spanish
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  BANK: "Banco",
  CASH: "Efectivo",
  DIGITAL: "Digital",
  CARD: "Tarjeta",
  INVESTMENT: "Inversión",
};

// Icons for account types (Lucide icon names)
export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  BANK: "Building2",
  CASH: "Banknote",
  DIGITAL: "Smartphone",
  CARD: "CreditCard",
  INVESTMENT: "TrendingUp",
};
