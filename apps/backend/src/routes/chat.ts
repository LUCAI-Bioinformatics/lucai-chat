import type { Request, Response } from 'express';
import { Router } from 'express';

import { ASK_SERVICE_URL } from '../config.js';

type ChatRequestBody = {
  question?: string;
  sql_only?: boolean;
};

const chatRouter = Router();

chatRouter.post('/', async (req: Request, res: Response) => {
  const { question, sql_only: sqlOnly } = req.body as ChatRequestBody;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'question is required' });
  }

  try {
    const askResponse = await fetch(`${ASK_SERVICE_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        sql_only: Boolean(sqlOnly),
      }),
    });

    if (!askResponse.ok) {
      let detail: unknown;
      try {
        detail = await askResponse.json();
      } catch {
        detail = await askResponse.text();
      }
      return res.status(askResponse.status).json({
        error: 'ask-service-error',
        detail,
      });
    }

    const payload = await askResponse.json();
    return res.json(payload);
  } catch (error) {
    console.error('[chat] ask service request failed', error);
    return res.status(502).json({ error: 'ask-service-unreachable' });
  }
});

export default chatRouter;
