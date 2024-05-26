import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.post('/add-friend', async (req, res) => {
    interface MinimalUser {
      id: number;
    }
  
    const user = req.user as MinimalUser | undefined;
    const friendId = parseInt(req.body.friendId, 10);
  
    if (!user || !user.id || !friendId) {
      return res.status(400).send('Invalid data');
    }
  
    if (friendId === user.id) {
      return res.status(400).send('Cannot follow yourself');
    }
  
    try {
      const userQuery = 'SELECT friends FROM users WHERE id = $1';
      const userRes = await pool.query(userQuery, [user.id]);
      let friends = userRes.rows[0]?.friends || [];
  
      if (friends.includes(friendId)) {
        return res.status(400).send('User already followed');
      }
  
      friends = [...friends, friendId];
      const updateQuery = 'UPDATE users SET friends = $1 WHERE id = $2 RETURNING *';
      const updatedUser = await pool.query(updateQuery, [friends, user.id]);
      res.json(updatedUser.rows[0]);
    } catch (error) {
      console.error('Error adding friend:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  export default router;
  