import 'dotenv/config';
import express, { type Express } from 'express';

const app: Express = express();
const PORT = process.env['PORT'] ?? 3333;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.warn(`Backend rodando na porta ${PORT}`);
});

export { app };
