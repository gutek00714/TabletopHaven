import { Router, Request, Response } from 'express';
import pool from '../db/pool'; // Adjust the path as necessary

interface MinimalUser {
  id: number;
}

const router = Router();

router.post('/remove-from-favorites', async (req: Request, res: Response) => {
  const user = req.user as MinimalUser | undefined;
  const gameId = parseInt(req.body.gameId, 10);

  if (!user || !user.id || !gameId) {
    return res.status(400).send('Invalid data');
  }

  try {
    const userQuery = 'SELECT favorites FROM users WHERE id = $1';
    const userRes = await pool.query(userQuery, [user.id]);
    let favorites = userRes.rows[0]?.favorites || [];

    // Remove the game from the favorites
    favorites = favorites.filter((g: number) => g !== gameId);

    // Update the user's favorites
    const updateQuery = 'UPDATE users SET favorites = $1 WHERE id = $2 RETURNING *';
    const updatedUser = await pool.query(updateQuery, [favorites, user.id]);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error removing game from favorites:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
