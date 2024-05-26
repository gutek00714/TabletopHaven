import pool from '../db/pool'; // Adjust the path as necessary

export async function getGameDetails(gameId: number) {
  const query = 'SELECT * FROM games WHERE id = $1';
  try {
    const res = await pool.query(query, [gameId]);
    return res.rows[0];
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error executing query', err.stack);
    } else {
      console.error('An unknown error occurred');
    }
    throw err;
  }
}
