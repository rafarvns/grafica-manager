import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string({ message: 'DATABASE_URL é obrigatória' }),
  API_TOKEN: z
    .string({ message: 'API_TOKEN é obrigatória' })
    .refine(
      (token) => token.length >= 32,
      'API_TOKEN deve ter pelo menos 32 caracteres'
    ),
  PORT: z.string({ message: 'PORT é obrigatória' }).transform((val) => parseInt(val, 10)),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const firstError = result.error.errors[0];
    throw new Error(firstError?.message || 'Erro ao validar variáveis de ambiente');
  }

  cachedEnv = result.data;
  return cachedEnv;
}
