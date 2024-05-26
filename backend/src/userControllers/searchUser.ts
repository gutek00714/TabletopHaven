import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/search-users', async (req, res) => {
    const searchQuery = typeof req.query.q === 'string' ? req.query.q : '';
    if (!searchQuery) {
      return res.json([]);
    }
  
    try {
      const query = 'SELECT * FROM users WHERE LOWER(username) LIKE $1 LIMIT 100';
      const results = await pool.query(query, [`%${searchQuery.toLowerCase()}%`]);
      res.json(results.rows);
    } catch (err) {
      if (err instanceof Error) {
        console.error('Error executing user search query', err.stack);
      } else {
        console.error('An unknown error occurred');
      }
    }
  });

  
export default router;