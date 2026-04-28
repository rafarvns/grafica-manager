export interface CreatePaperTypeInput {
  name: string;
  weight: number;
  standardSize: string;
  color: string;
}

export interface CreatePaperTypeOutput {
  id: string;
  name: string;
  weight: number;
  standardSize: string;
  color: string;
  createdAt: Date;
}
