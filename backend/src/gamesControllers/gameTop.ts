import pool from '../db/pool'; // Adjust the path as necessary

export async function getTopGames() {
  const query = `
    SELECT g.id, g.name, g.publisher, g.description, g.categories, g.min_players, g.max_players, g.play_time, g.age, g.foreign_names, g.image, g.bgg_id,
       COALESCE(ROUND((g.total_rating_score::FLOAT / NULLIF(g.rating_count, 0))::numeric, 1), 0) AS average_rating
    FROM games g
    ORDER BY average_rating DESC, g.rating_count DESC
    LIMIT 5;
  `;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error executing query', err.stack);
    } else {
      console.error('An unknown error occurred');
    }
    throw err;
  }
}