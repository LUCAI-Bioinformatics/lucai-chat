import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const apiPrefix = process.env.API_PREFIX ?? '/api';

const allowList = (process.env.CORS_ALLOW_ORIGINS ?? '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: allowList.length > 0 ? allowList : undefined,
    credentials: true
  })
);
app.use(express.json());

app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get(`${apiPrefix}/status`, (_req: Request, res: Response) => {
  res.json({ uptime: process.uptime(), timestamp: Date.now() });
});

app.listen(port, () => {
  console.log(`Backend API listening on port ${port}`);
});
