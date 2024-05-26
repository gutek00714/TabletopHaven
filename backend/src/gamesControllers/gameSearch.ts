import pool from '../db/pool'; 

export async function searchGames(searchQuery: string) {
  try {
    const query = 'SELECT * FROM games WHERE LOWER(name) LIKE $1 LIMIT 100'; // Limiting to 100 results for efficiency
    const results = await pool.query(query, [`%${searchQuery.toLowerCase()}%`]);
    return results.rows;
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error executing search query', err.stack);
    } else {
      console.error('An unknown error occurred');
    }
    throw err;
  }
}
