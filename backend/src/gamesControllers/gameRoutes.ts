import { Request, Response, Router } from 'express';
import pool from '../db/pool';
import { getGameDetails} from './gameDetails';
import { getTopGames } from './gameTop';
import { getRanking } from './gameRanking';
import { searchGames } from './gameSearch';
import getCategories from './gameCategories';

interface MinimalUser {
  id: number;
}

const router = Router();

router.get('/game/:gameId', async (req: Request, res: Response) => {
  const user = req.user as MinimalUser | undefined;
  const gameId = parseInt(req.params.gameId, 10);

  if (isNaN(gameId) || gameId <= 0) {
    return res.status(400).send('Invalid game ID');
  }

  try {
    const gameDetails = await getGameDetails(gameId);
    if (!gameDetails) {
      return res.status(404).send('Game not found');
    }

    let ownedGames: number[] = [];
    let wishlist: number[] = [];
    let favorites: number[] = [];

    if (user && user.id) {
      const userQuery = 'SELECT owned_games, wishlist, favorites FROM users WHERE id = $1';
      const userRes = await pool.query(userQuery, [user.id]);
      ownedGames = userRes.rows[0]?.owned_games || [];
      wishlist = userRes.rows[0]?.wishlist || [];
      favorites = userRes.rows[0]?.favorites || [];
    }

    res.json({ ...gameDetails, owned_games: ownedGames, wishlist, favorites });
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/top-games', async (req: Request, res: Response) => {
  try {
    const games = await getTopGames();
    res.json(games);
  } catch (err) {
    console.error('Error fetching top games:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/ranking', async (req: Request, res: Response) => {
  try {
    const games = await getRanking();
    res.json(games);
  } catch (err) {
    console.error('Error fetching ranking:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/search-games', async (req: Request, res: Response) => {
  const searchQuery = typeof req.query.q === 'string' ? req.query.q : '';
  if (!searchQuery) {
    return res.json([]);
  }

  try {
    const games = await searchGames(searchQuery);
    res.json(games);
  } catch (err) {
    console.error('Error searching games:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.use(getCategories);

export default router;
