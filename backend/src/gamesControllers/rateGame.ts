import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.post('/rate-game', async (req, res) => {
    interface MinimalUser {
      id: number;
    }
  
    const user = req.user as MinimalUser | undefined;
    const gameId = parseInt(req.body.gameId, 10);
    const rating = parseInt(req.body.rating, 10);
  
    // Check if user is not authenticated
    if (!req.isAuthenticated() || !user) {
      return res.status(401).send('User not logged in');
    }
  
    if (!user.id || !gameId || isNaN(rating) || rating < 1 || rating > 10) {
      return res.status(400).send('Invalid data');
    }
  
    try {
      // Check if user has already rated the game
      const ratingCheckQuery = 'SELECT rating FROM user_game_ratings WHERE user_id = $1 AND game_id = $2';
      const ratingCheckRes = await pool.query(ratingCheckQuery, [user.id, gameId]);
      const existingRating = ratingCheckRes.rows[0]?.rating;
  
      const upsertRatingQuery = `
        INSERT INTO user_game_ratings (user_id, game_id, rating)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, game_id) 
        DO UPDATE SET rating = EXCLUDED.rating;
      `;
      await pool.query(upsertRatingQuery, [user.id, gameId, rating]);
  
      let updateGameRatingQuery = '';
      if (existingRating) {
        updateGameRatingQuery = `
          UPDATE games
          SET total_rating_score = total_rating_score - $1 + $2
          WHERE id = $3;
        `;
        await pool.query(updateGameRatingQuery, [existingRating, rating, gameId]);
      } else {
        updateGameRatingQuery = `
          UPDATE games
          SET total_rating_score = total_rating_score + $1,
              rating_count = rating_count + 1
          WHERE id = $2;
        `;
        await pool.query(updateGameRatingQuery, [rating, gameId]);
      }
  
      res.send('Rating updated successfully');
    } catch (error) {
      console.error('Error submitting rating:', error);
      res.status(500).send('Internal Server Error');
    }
  });

export default router;