import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/user-rating/:gameId', async (req, res) => {
    interface MinimalUser {
      id: number;
    }
    const user = req.user as MinimalUser | undefined;
    const gameId = parseInt(req.params.gameId, 10);
  
    if (!user || !user.id) {
      return res.status(401).json({ message: 'User not logged in.' });
    }
  
    if (!gameId) {
      return res.status(400).send('Invalid game ID');
    }
  
    try {
      const ratingQuery = 'SELECT rating FROM user_game_ratings WHERE user_id = $1 AND game_id = $2';
      const ratingRes = await pool.query(ratingQuery, [user.id, gameId]);
      const userRating = ratingRes.rows[0] ? ratingRes.rows[0].rating : null;
  
      res.json({ rating: userRating });
    } catch (error) {
      console.error('Error fetching user rating:', error);
      res.status(500).send('Internal Server Error');
    }
  });

export default router;