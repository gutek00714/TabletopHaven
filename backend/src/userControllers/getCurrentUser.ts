import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/current-user', async (req, res) => {
    interface MinimalUser {
      id: number;
    }
    const user = req.user as MinimalUser | undefined;
    if (!user) {
      return res.status(401).send('User not logged in');
    }
    res.json({ userId: user.id });
  });

export default router;