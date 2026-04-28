export class FileStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileStorageError';
  }
}

export class FileTooLargeError extends FileStorageError {
  constructor(maxSizeMB: number) {
    super(`Arquivo excede o limite de ${maxSizeMB}MB`);
    this.name = 'FileTooLargeError';
  }
}

export class InvalidMimeTypeError extends FileStorageError {
  constructor(allowedTypes: string[]) {
    super(`Tipo de arquivo não permitido. Aceitos: ${allowedTypes.join(', ')}`);
    this.name = 'InvalidMimeTypeError';
  }
}

export class FileNotFoundError extends FileStorageError {
  constructor() {
    super('Arquivo não encontrado');
    this.name = 'FileNotFoundError';
  }
}
