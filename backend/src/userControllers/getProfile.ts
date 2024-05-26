import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/user/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    
    if (!userId) {
      return res.status(400).send('Invalid user ID');
    }
  
    try {
      const userDetailsQuery = 'SELECT username, profile_image_url, owned_games, wishlist, favorites FROM users WHERE id = $1';
      const userDetailsRes = await pool.query(userDetailsQuery, [userId]);
      const userProfile = userDetailsRes.rows[0];
  
      if (!userProfile) {
        return res.status(404).send('User not found');
      }
  
      res.json(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  export default router;
  