import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/user/:userId/eligible-groups', async (req, res) => {
    interface MinimalUser {
      id: number;
    }
    const loggedInUser = req.user as MinimalUser | undefined;
    
    if (!loggedInUser || typeof loggedInUser.id !== 'number') {
      return res.status(401).json({ message: 'User not logged in.' });
    }
    const loggedInUserId = loggedInUser.id;
    console.log(`User ${loggedInUserId}`)
  
    const profileUserId = parseInt(req.params.userId, 10);
    console.log(`User ${profileUserId}`)
    if (isNaN(profileUserId)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    try {
      const query = `
        SELECT g.id, g.name
        FROM groups g
        WHERE g.owner_id = $1 AND NOT EXISTS (
          SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = $2
        );
      `;
      const result = await pool.query(query, [loggedInUserId, profileUserId]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching eligible groups:', error);
      res.status(500).send('Internal Server Error');
    }
  });

export default router;