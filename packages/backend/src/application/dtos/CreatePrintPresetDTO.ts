export interface CreatePrintPresetInput {
  name: string;
  colorMode: 'CMYK' | 'RGB' | 'GRAYSCALE';
  paperTypeId: string;
  quality: 'rascunho' | 'normal' | 'alta';
  dpi: 150 | 300 | 600;
}

export interface CreatePrintPresetOutput {
  id: string;
  name: string;
  colorMode: 'CMYK' | 'RGB' | 'GRAYSCALE';
  paperTypeId: string;
  paperTypeName: string;
  quality: 'rascunho' | 'normal' | 'alta';
  dpi: 150 | 300 | 600;
  createdAt: Date;
}
