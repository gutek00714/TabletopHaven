import { Router, Request, Response } from 'express';
import pool from '../db/pool'; // Adjust the path as necessary

interface MinimalUser {
  id: number;
}

const router = Router();

router.post('/remove-from-shelf', async (req: Request, res: Response) => {
  const user = req.user as MinimalUser | undefined;
  const gameId = parseInt(req.body.gameId, 10);

  if (!user || !user.id || !gameId) {
    return res.status(400).send('Invalid data');
  }

  try {
    const userQuery = 'SELECT owned_games FROM users WHERE id = $1';
    const userRes = await pool.query(userQuery, [user.id]);
    let ownedGames = userRes.rows[0]?.owned_games || [];
    
    // Remove the game from the owned games list
    ownedGames = ownedGames.filter((g: number) => g !== gameId);

    // Update the user's owned games
    const updateQuery = 'UPDATE users SET owned_games = $1 WHERE id = $2 RETURNING *';
    const updatedUser = await pool.query(updateQuery, [ownedGames, user.id]);

    console.log('Updated user with removed game:', updatedUser.rows[0]);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error removing game from shelf:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
