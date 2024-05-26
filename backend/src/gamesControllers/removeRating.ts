import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.delete('/remove-rating/:gameId', async (req, res) => {
    interface MinimalUser {
      id: number;
    }
    const user = req.user as MinimalUser | undefined;
    const gameId = parseInt(req.params.gameId, 10);
  
    if (!user || !user.id) {
      return res.status(401).send('User not logged in');
    }
  
    if (!gameId) {
      return res.status(400).send('Invalid game ID');
    }
  
    try {
      // Check if user has rated the game
      const ratingCheckQuery = 'SELECT rating FROM user_game_ratings WHERE user_id = $1 AND game_id = $2';
      const ratingCheckRes = await pool.query(ratingCheckQuery, [user.id, gameId]);
      const existingRating = ratingCheckRes.rows[0]?.rating;
  
      if (existingRating) {
        // Delete the rating
        const deleteRatingQuery = 'DELETE FROM user_game_ratings WHERE user_id = $1 AND game_id = $2';
        await pool.query(deleteRatingQuery, [user.id, gameId]);
  
        // Update the game's total rating score and count
        const updateGameRatingQuery = `
          UPDATE games
          SET total_rating_score = total_rating_score - $1,
              rating_count = rating_count - 1
          WHERE id = $2;
        `;
        await pool.query(updateGameRatingQuery, [existingRating, gameId]);
      }
  
      res.send('Rating removed successfully');
    } catch (error) {
      console.error('Error removing rating:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  
  

export default router;