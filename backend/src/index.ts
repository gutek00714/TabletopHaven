import http from "node:http";
import express from "express";
import session from 'express-session';
import passport from 'passport';
import './passport-setup';
import cors from 'cors';

import { gameDetails } from "./bggAPI/gameDetails";
import { bggAPI } from "./controllers/bggAPI";
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';

require('dotenv').config();
console.log('PostgreSQL connection settings:', {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const path = require('path');
const PORT = 3000;
const app = express();

const PgSession = pgSession(session);
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET is not set');
}

app.use(express.static('public'));
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:8081', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // allow these methods
  allowedHeaders: ['Content-Type', 'Authorization'] // allow these headers
}));

app.use(gameDetails);
app.use(bggAPI);


app.use(session({
  store: new PgSession({
    pool: new Pool({ // Use node-postgres Pool
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432', 10)
    }),
    tableName: 'session' // optional, default is 'session'
  }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days for example
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google Auth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { 
      failureRedirect: 'http://localhost:8081' // Redirect to Vue.js fail route
  }),
  (req, res) => {
    // Successful authentication, redirect to Vue.js success route
    res.redirect('http://localhost:8081');
  });

app.get('/logout', (req, res) => {
  console.log('Initiating logout for user:', req.user);
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Error during logout');
    }
    req.session.destroy(err => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).send('Could not log out');
      }
      console.log('Session destroyed');
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out' });
    });
  });
});  

app.get('/check-login-status', (req, res) => {
  console.log('Checking login status, user:', req.user);
  if (req.isAuthenticated()) {
    res.json({ isLoggedIn: true });
  } else {
    res.json({ isLoggedIn: false });
  }
});

app.get('/game/:gameId', async (req, res) => {
  interface MinimalUser {
    id: number;
  }

  const user = req.user as MinimalUser | undefined;

  const gameId = parseInt(req.params.gameId, 10);
  if (!gameId) {
    return res.status(400).send('Invalid game ID');
  }

  try {
    const gameDetails = await getGameDetails(gameId);
    if (!gameDetails) {
      return res.status(404).send('Game not found');
    }

    let ownedGames = [];
    let wishlist = [];
    let favorites = [];
  
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


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function getGameDetails(gameId: number) {
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

app.get('/top-games', async (req, res) => {
  try {
    const query = `
    SELECT g.id, g.name, g.publisher, g.description, g.categories, g.min_players, g.max_players, g.play_time, g.age, g.foreign_names, g.image, g.bgg_id,
       COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating
    FROM games g
    LEFT JOIN LATERAL unnest(g.rating) AS r(rating) ON true
    GROUP BY g.id
    ORDER BY average_rating DESC
    LIMIT 5;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error executing query', err.stack);
    } else {
      console.error('An unknown error occurred');
    }
    res.status(500).send('Internal Server Error');
  }
});

app.get('/search-games', async (req, res) => {
  const searchQuery = typeof req.query.q === 'string' ? req.query.q : '';
  if (!searchQuery) {
    return res.json([]);
  }

  try {
    const query = 'SELECT * FROM games WHERE LOWER(name) LIKE $1 LIMIT 100'; // Limiting to 10 results for efficiency
    const results = await pool.query(query, [`%${searchQuery.toLowerCase()}%`]);
    res.json(results.rows);
    } catch (err) {
      if (err instanceof Error) {
        console.error('Error executing search query', err.stack);
      } else {
        console.error('An unknown error occurred');
      }
    }
});

app.post('/add-to-shelf', async (req, res) => {
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  // Define a minimal user interface that includes the id property
  interface MinimalUser {
    id: number;
  }

  // Use type assertion to tell TypeScript that req.user is of type MinimalUser
  const user = req.user as MinimalUser | undefined;

  const gameId = parseInt(req.body.gameId, 10);

  if (!user || !user.id || !gameId) {
    return res.status(400).send('Invalid data');
  }

  try {
    const userQuery = 'SELECT owned_games FROM users WHERE id = $1';
    const userRes = await pool.query(userQuery, [user.id]);
    const ownedGames = userRes.rows[0].owned_games;

    if (ownedGames.includes(gameId)) {
      return res.status(400).send('Game already in shelf');
    }

    const updateQuery = 'UPDATE users SET owned_games = array_append(owned_games, $1) WHERE id = $2 RETURNING *';
    const updatedUser = await pool.query(updateQuery, [gameId, user.id]);
    console.log('Updated user with new game:', updatedUser.rows[0]);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error adding game to shelf:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/add-to-wishlist', async (req, res) => {
  interface MinimalUser {
    id: number;
  }

  const user = req.user as MinimalUser | undefined;
  const gameId = parseInt(req.body.gameId, 10);

  if (!user || !user.id || !gameId) {
    return res.status(400).send('Invalid data');
  }

  try {
    const userQuery = 'SELECT wishlist FROM users WHERE id = $1';
    const userRes = await pool.query(userQuery, [user.id]);
    let wishlist = userRes.rows[0]?.wishlist || [];

    if (wishlist.includes(gameId)) {
      return res.status(400).send('Game already in wishlist');
    }

    wishlist = [...wishlist, gameId];
    const updateQuery = 'UPDATE users SET wishlist = $1 WHERE id = $2 RETURNING *';
    const updatedUser = await pool.query(updateQuery, [wishlist, user.id]);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error adding game to wishlist:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/add-to-favorites', async (req, res) => {
  interface MinimalUser {
    id: number;
  }

  const user = req.user as MinimalUser | undefined;
  const gameId = parseInt(req.body.gameId, 10);

  if (!user || !user.id || !gameId) {
    return res.status(400).send('Invalid data');
  }

  try {
    const userQuery = 'SELECT favorites FROM users WHERE id = $1';
    const userRes = await pool.query(userQuery, [user.id]);
    let favorites = userRes.rows[0]?.favorites || [];

    if (favorites.includes(gameId)) {
      return res.status(400).send('Game already in favorites');
    }

    favorites = [...favorites, gameId];
    const updateQuery = 'UPDATE users SET favorites = $1 WHERE id = $2 RETURNING *';
    const updatedUser = await pool.query(updateQuery, [favorites, user.id]);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error adding game to favorites:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/remove-from-shelf', async (req, res) => {
  interface MinimalUser {
    id: number;
  }

  const user = req.user as MinimalUser | undefined;
  const gameId = parseInt(req.body.gameId, 10);

  if (!user || !user.id || !gameId) {
    return res.status(400).send('Invalid data');
  }

  try {
    // Fetch current owned games
    const userQuery = 'SELECT owned_games FROM users WHERE id = $1';
    const userRes = await pool.query(userQuery, [user.id]);
    let ownedGames = userRes.rows[0]?.owned_games || [];

    // Remove the game from the owned games list
    ownedGames = ownedGames.filter((g: number) => g !== gameId);

    // Update the user's owned games
    const updateQuery = 'UPDATE users SET owned_games = $1 WHERE id = $2 RETURNING *';
    const updatedUser = await pool.query(updateQuery, [ownedGames, user.id]);

    console.log('Updated user with removed game:', updatedUser.rows[0]);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error removing game from shelf:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/remove-from-wishlist', async (req, res) => {
  interface MinimalUser {
    id: number;
  }

  const user = req.user as MinimalUser | undefined;
  const gameId = parseInt(req.body.gameId, 10);

  if (!user || !user.id || !gameId) {
    return res.status(400).send('Invalid data');
  }

  try {
    // Fetch current wishlist
    const userQuery = 'SELECT wishlist FROM users WHERE id = $1';
    const userRes = await pool.query(userQuery, [user.id]);
    let wishlist = userRes.rows[0]?.wishlist || [];

    // Remove the game from the wishlist
    wishlist = wishlist.filter((g: number) => g !== gameId);

    // Update the user's wishlist
    const updateQuery = 'UPDATE users SET wishlist = $1 WHERE id = $2 RETURNING *';
    const updatedUser = await pool.query(updateQuery, [wishlist, user.id]);

    console.log('Updated user with removed game from wishlist:', updatedUser.rows[0]);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error removing game from wishlist:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/remove-from-favorites', async (req, res) => {
  interface MinimalUser {
    id: number;
  }

  const user = req.user as MinimalUser | undefined;
  const gameId = parseInt(req.body.gameId, 10);

  if (!user || !user.id || !gameId) {
    return res.status(400).send('Invalid data');
  }

  try {
    // Fetch current favorites
    const userQuery = 'SELECT favorites FROM users WHERE id = $1';
    const userRes = await pool.query(userQuery, [user.id]);
    let favorites = userRes.rows[0]?.favorites || [];

    // Remove the game from the favorites
    favorites = favorites.filter((g: number) => g !== gameId);

    // Update the user's favorites
    const updateQuery = 'UPDATE users SET favorites = $1 WHERE id = $2 RETURNING *';
    const updatedUser = await pool.query(updateQuery, [favorites, user.id]);

    console.log('Updated user with removed game from favorites:', updatedUser.rows[0]);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error removing game from favorites:', error);
    res.status(500).send('Internal Server Error');
  }
});

http.createServer(app).listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
