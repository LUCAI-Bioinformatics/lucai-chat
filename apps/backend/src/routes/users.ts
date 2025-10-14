import type { Request, Response } from 'express';
import { Router } from 'express';

import { findUserById, listUsers } from '../db.js';

const usersRouter = Router();

usersRouter.get('/', (_req: Request, res: Response) => {
  const users = listUsers();
  res.json({ data: users });
});

usersRouter.get('/:id', (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  const user = findUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ data: user });
});

export default usersRouter;
