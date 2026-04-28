export interface CustomerDeletionValidationOutput {
  canDelete: boolean;
  reason: string | null;
  activeOrderCount: number;
}

export interface OrderDeletionValidationOutput {
  canDelete: boolean;
  reason: string | null;
  inProgressPrintJobCount: number;
}
