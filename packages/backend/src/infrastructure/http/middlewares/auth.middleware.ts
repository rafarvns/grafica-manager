import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';

type TokenProvider = () => string;

export function authMiddleware(getToken: TokenProvider) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization as string | undefined;

    if (!authHeader || authHeader.trim() === '') {
      res.status(401).json({ error: 'Token não informado' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    const token = parts[1]!;
    const expectedToken = getToken();

    const tokenBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expectedToken);

    if (tokenBuffer.length !== expectedBuffer.length) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    try {
      const isValid = timingSafeEqual(tokenBuffer, expectedBuffer);
      if (!isValid) {
        res.status(401).json({ error: 'Token inválido' });
        return;
      }
    } catch {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    next();
  };
}
