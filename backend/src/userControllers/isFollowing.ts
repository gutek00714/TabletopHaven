import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/is-following/:friendId', async (req, res) => {
    interface MinimalUser {
      id: number;
    }
  
    const user = req.user as MinimalUser | undefined;
    const friendId = parseInt(req.params.friendId, 10);
    if (!user || !user.id || !friendId) {
      return res.status(400).send('Invalid data');
    }
  
    try {
      const userQuery = 'SELECT friends FROM users WHERE id = $1';
      const userRes = await pool.query(userQuery, [user.id]);
      const friends = userRes.rows[0]?.friends || [];
  
      const isFollowing = friends.includes(friendId);
      res.json({ isFollowing });
    } catch (error) {
      console.error('Error checking follow status:', error);
      res.status(500).send('Internal Server Error');
    }
  });

export default router;