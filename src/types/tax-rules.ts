export type TaxRuleWithRelations = {
  id: string;
  name: string;
  percentage: number;
  isActive: boolean;
  workspaceId: string;
};

export type TaxRuleFormData = {
  id?: string;
  name: string;
  percentage: number;
  workspaceId: string;
};
