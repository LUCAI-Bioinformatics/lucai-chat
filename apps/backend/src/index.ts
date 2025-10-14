import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import { API_PREFIX, CORS_ALLOW_ORIGINS, PORT } from './config.js';
import chatRouter from './routes/chat.js';
import usersRouter from './routes/users.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: CORS_ALLOW_ORIGINS.length > 0 ? CORS_ALLOW_ORIGINS : true,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get(`${API_PREFIX}/status`, (_req: Request, res: Response) => {
  res.json({ uptime: process.uptime(), timestamp: Date.now() });
});

app.use(`${API_PREFIX}/users`, usersRouter);
app.use(`${API_PREFIX}/chat`, chatRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'not-found' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[backend] unexpected error', err);
  res.status(500).json({ error: 'internal-error' });
});

app.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`);
});
