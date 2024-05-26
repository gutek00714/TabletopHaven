import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/user-friends', async (req, res) => {
    interface MinimalUser {
      id: number;
    }
    const user = req.user as MinimalUser | undefined;
  
    if (!user || !user.id) {
      return res.status(401).json({ message: 'User not logged in.' });
    }
  
    try {
      const friendsQuery = 'SELECT friends FROM users WHERE id = $1';
      const friendsRes = await pool.query(friendsQuery, [user.id]);
      const friendIds = friendsRes.rows[0].friends;
  
      const userDetailsQuery = 'SELECT id, username, profile_image_url FROM users WHERE id = ANY($1)';
      const userDetailsRes = await pool.query(userDetailsQuery, [friendIds]);
      res.json(userDetailsRes.rows);
    } catch (error) {
      console.error('Error fetching friends:', error);
      res.status(500).send('Internal Server Error');
    }
  });

export default router;