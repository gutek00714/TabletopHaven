import { Router, Request, Response } from 'express';
import pool from '../db/pool'; // Adjust the path as necessary

interface MinimalUser {
  id: number;
}

const router = Router();

router.post('/add-to-shelf', async (req: Request, res: Response) => {
  const user = req.user as MinimalUser | undefined;
  const gameId = parseInt(req.body.gameId, 10);

  if (!user || !user.id || !gameId) {
    return res.status(400).send('Invalid data');
  }

  try {
    const userQuery = 'SELECT owned_games FROM users WHERE id = $1';
    const userRes = await pool.query(userQuery, [user.id]);
    let ownedGames = userRes.rows[0]?.owned_games || [];

    if (!ownedGames) {
      ownedGames = [];
    }

    if (ownedGames.includes(gameId)) {
      return res.status(400).send('Game already in shelf');
    }

    ownedGames.push(gameId);
    const updateQuery = 'UPDATE users SET owned_games = $1 WHERE id = $2 RETURNING *';
    const updatedUser = await pool.query(updateQuery, [ownedGames, user.id]);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error adding game to shelf:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
