export class PaperTypeInUseError extends Error {
  constructor(presetsCount: number) {
    super(
      `Este tipo de papel está em uso por ${presetsCount} preset(s). ` +
        'Para deletar mesmo assim, use a flag force=true.'
    );
    this.name = 'PaperTypeInUseError';
  }
}
