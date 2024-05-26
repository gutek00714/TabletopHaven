import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.post('/group/:groupId/create-event', async (req, res) => {
    interface MinimalUser {
      id: number;
    }
    const user = req.user as MinimalUser | undefined;
    if (!user || !user.id) {
      return res.status(401).json({ message: 'User not logged in.' });
    }
  
    const groupId = req.params.groupId;
    const { eventName, eventDate} = req.body;
  
    try {
      const createEventQuery = `
        INSERT INTO calendar_events (group_id, name, date)
        VALUES ($1, $2, $3)
        RETURNING *;`;
  
      const result = await pool.query(createEventQuery, [groupId, eventName, eventDate]);
      res.json(result.rows[0]);
  
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).send('Internal Server Error');
    }
  });

export default router;