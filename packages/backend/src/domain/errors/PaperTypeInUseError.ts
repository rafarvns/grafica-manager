export class PaperTypeInUseError extends Error {
  constructor(presetsCount: number) {
    const noun = presetsCount === 1 ? 'preset' : 'presets';
    super(
      `Este tipo de papel está em uso por ${presetsCount} ${noun}. ` +
        'Para deletar mesmo assim, use a flag force=true.'
    );
    this.name = 'PaperTypeInUseError';
  }
}
