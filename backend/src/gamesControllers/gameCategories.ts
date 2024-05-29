import { Router } from 'express';
import pool from '../db/pool'; // Adjust the path as necessary

const router = Router();

// Categories route
router.get('/categories', async (req, res) => {
  try {
    const query = 'SELECT DISTINCT unnest(categories) AS category FROM games ORDER BY category';
    const result = await pool.query(query);
    res.json(result.rows.map(row => row.category));
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Internal Server Error');
  }
});

// Games by category route
router.get('/games/category/:category', async (req, res) => {
  const category = req.params.category;
  try {
    const query = 'SELECT * FROM games WHERE $1 = ANY(categories)';
    const result = await pool.query(query, [category]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
