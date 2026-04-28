export interface CreatePrintPresetInput {
  name: string;
  paperTypeId: string;
  quality: string;
  colors: string;
  finish: string;
  active?: boolean;
}

export interface CreatePrintPresetOutput {
  id: string;
  name: string;
  paperTypeId: string;
  paperTypeName: string;
  quality: string;
  colors: string;
  finish: string;
  active: boolean;
  createdAt: Date;
}
