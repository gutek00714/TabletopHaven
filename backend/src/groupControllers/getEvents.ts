import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/group/:groupId/events', async (req, res) => {
    const groupId = req.params.groupId;
  
    try {
      const getEventsQuery = `
        SELECT * FROM calendar_events
        WHERE group_id = $1;`;
  
      const events = await pool.query(getEventsQuery, [groupId]);
      res.json(events.rows);
  
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).send('Internal Server Error');
    }
  });

export default router;