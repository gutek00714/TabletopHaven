import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.post('/create-group', async (req, res) => {
    interface MinimalUser {
      id: number;
    }
    const user = req.user as MinimalUser | undefined;
  
    if (!user || !user.id) {
      return res.status(401).json({ message: 'User not logged in.' });
    }
  
    const { groupName } = req.body;
  
    try {
      const createGroupQuery = `
        INSERT INTO groups (name, owner_id)
        VALUES ($1, $2)
        RETURNING *;`;
  
      const result = await pool.query(createGroupQuery, [groupName, user.id]);
      res.json(result.rows[0]);
  
    } catch (error) {
      console.error('Error creating group:', error);
      res.status(500).send('Internal Server Error');
    }
  });

export default router;