import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/user-groups', async (req, res) => {
    interface MinimalUser {
      id: number;
    }
    const user = req.user as MinimalUser | undefined;
  
    if (!user || !user.id) {
      return res.status(401).json({ message: 'User not logged in.' });
    }
  
    try {
      const query = `
        SELECT DISTINCT g.id, g.name
        FROM groups g
        LEFT JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = $1 OR g.owner_id = $1;
      `;
      const result = await pool.query(query, [user.id]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching user groups:', error);
      res.status(500).send('Internal Server Error');
    }
  });

export default router;