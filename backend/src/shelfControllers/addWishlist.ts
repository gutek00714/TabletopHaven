import { Router, Request, Response } from 'express';
import pool from '../db/pool';

interface MinimalUser {
  id: number;
}

const router = Router();

router.post('/add-to-wishlist', async (req: Request, res: Response) => {
  const user = req.user as MinimalUser | undefined;
  const gameId = parseInt(req.body.gameId, 10);

  if (!user || !user.id || !gameId) {
    return res.status(400).send('Invalid data');
  }

  try {
    const userQuery = 'SELECT wishlist FROM users WHERE id = $1';
    const userRes = await pool.query(userQuery, [user.id]);
    let wishlist = userRes.rows[0]?.wishlist || [];

    if (!wishlist) {
      wishlist = [];
    }

    if (wishlist.includes(gameId)) {
      return res.status(400).send('Game already in wishlist');
    }

    wishlist.push(gameId);
    const updateQuery = 'UPDATE users SET wishlist = $1 WHERE id = $2 RETURNING *';
    const updatedUser = await pool.query(updateQuery, [wishlist, user.id]);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error adding game to wishlist:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
