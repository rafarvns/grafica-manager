import { createHmac } from 'crypto';

export class HMACValidator {
  constructor(private secret: string) {}

  sign(payload: string): string {
    return createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
  }

  validate(payload: string, signature: string): boolean {
    if (!signature) {
      return false;
    }

    const expectedSignature = this.sign(payload);
    return expectedSignature === signature;
  }
}
