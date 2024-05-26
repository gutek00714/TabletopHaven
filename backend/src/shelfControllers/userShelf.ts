import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/user-shelf', async (req, res) => {
    interface MinimalUser {
      id: number;
    }
    const user = req.user as MinimalUser | undefined;
  
    if (!user || !user.id) {
      return res.status(401).json({ message: 'User not logged in.' });
    }
  
    try {
      // Make sure to select the 'profile_image_url' column from the database
      const userDetailsQuery = 'SELECT username, profile_image_url, owned_games, wishlist, favorites FROM users WHERE id = $1';
      const userDetailsRes = await pool.query(userDetailsQuery, [user.id]);
      const { username, profile_image_url: profileImageUrl, owned_games: ownedGamesIds, wishlist: wishlistIds, favorites: favoritesIds } = userDetailsRes.rows[0];
  
      // Fetch the game details as before
      const gamesQuery = 'SELECT * FROM games WHERE id = ANY($1::int[])';
      const ownedGamesRes = await pool.query(gamesQuery, [ownedGamesIds]);
      const wishlistRes = await pool.query(gamesQuery, [wishlistIds]);
      const favoritesRes = await pool.query(gamesQuery, [favoritesIds]);
  
      // Include the profile image URL in the response
      res.json({
        username,
        profileImageUrl,
        ownedGames: ownedGamesRes.rows,
        wishlist: wishlistRes.rows,
        favorites: favoritesRes.rows
      });
    } catch (error) {
      console.error('Error fetching user shelf:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  export default router;