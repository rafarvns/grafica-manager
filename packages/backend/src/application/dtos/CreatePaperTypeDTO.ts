export interface CreatePaperTypeInput {
  name: string;
  weight: number;
  standardSize: string;
  color: string;
  active?: boolean;
}

export interface CreatePaperTypeOutput {
  id: string;
  name: string;
  weight: number;
  standardSize: string;
  color: string;
  active: boolean;
  createdAt: Date;
}
