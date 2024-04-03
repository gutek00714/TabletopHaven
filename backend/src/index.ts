import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
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
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:8081", // Match this to the frontend URL
    methods: ["GET", "POST"], // Adjust according to the methods you need
    credentials: true
  }
});


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
       COALESCE(ROUND((g.total_rating_score::FLOAT / NULLIF(g.rating_count, 0))::numeric, 1), 0) AS average_rating
    FROM games g
    ORDER BY average_rating DESC, g.rating_count DESC
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

app.get('/ranking', async (req, res) => {
  try {
    const query = `
    SELECT g.id, g.name, g.publisher, g.description, g.categories, g.min_players, g.max_players, g.play_time, g.age, g.foreign_names, g.image, g.bgg_id,
       COALESCE(ROUND((g.total_rating_score::FLOAT / NULLIF(g.rating_count, 0))::numeric, 1), 0) AS average_rating
    FROM games g
    ORDER BY average_rating DESC, g.rating_count DESC
    LIMIT 100;
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
    let ownedGames = userRes.rows[0].owned_games;

    if (!ownedGames) {
      ownedGames = [];
    }

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

    if (!wishlist) {
      wishlist = [];
    }

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

    if (!favorites) {
      favorites = [];
    }

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

app.get('/categories', async (req, res) => {
  try {
    const query = 'SELECT DISTINCT unnest(categories) AS category FROM games ORDER BY category';
    const result = await pool.query(query);
    res.json(result.rows.map(row => row.category));
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error executing query', err.stack);
    } else {
      console.error('An unknown error occurred');
    }
    res.status(500).send('Internal Server Error');
  }
});

app.get('/games/category/:category', async (req, res) => {
  const category = req.params.category;
  try {
    const query = 'SELECT * FROM games WHERE $1 = ANY(categories)';
    const result = await pool.query(query, [category]);
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

app.get('/current-user', async (req, res) => {
  interface MinimalUser {
    id: number;
  }
  const user = req.user as MinimalUser | undefined;
  if (!user) {
    return res.status(401).send('User not logged in');
  }
  res.json({ userId: user.id });
});

app.get('/user-shelf', async (req, res) => {
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

app.get('/user/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  
  if (!userId) {
    return res.status(400).send('Invalid user ID');
  }

  try {
    const userDetailsQuery = 'SELECT username, profile_image_url, owned_games, wishlist, favorites FROM users WHERE id = $1';
    const userDetailsRes = await pool.query(userDetailsQuery, [userId]);
    const userProfile = userDetailsRes.rows[0];

    if (!userProfile) {
      return res.status(404).send('User not found');
    }

    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/add-friend', async (req, res) => {
  interface MinimalUser {
    id: number;
  }

  const user = req.user as MinimalUser | undefined;
  const friendId = parseInt(req.body.friendId, 10);

  if (!user || !user.id || !friendId) {
    return res.status(400).send('Invalid data');
  }

  if (friendId === user.id) {
    return res.status(400).send('Cannot follow yourself');
  }

  try {
    const userQuery = 'SELECT friends FROM users WHERE id = $1';
    const userRes = await pool.query(userQuery, [user.id]);
    let friends = userRes.rows[0]?.friends || [];

    if (friends.includes(friendId)) {
      return res.status(400).send('User already followed');
    }

    friends = [...friends, friendId];
    const updateQuery = 'UPDATE users SET friends = $1 WHERE id = $2 RETURNING *';
    const updatedUser = await pool.query(updateQuery, [friends, user.id]);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/remove-friend', async (req, res) => {
  interface MinimalUser {
    id: number;
  }

  const user = req.user as MinimalUser | undefined;
  const friendId = parseInt(req.body.friendId, 10);

  if (!user || !user.id || !friendId) {
    return res.status(400).send('Invalid data');
  }

  if (friendId === user.id) {
    return res.status(400).send('Cannot follow yourself');
  }

  try {
    const userQuery = 'SELECT friends FROM users WHERE id = $1';
    const userRes = await pool.query(userQuery, [user.id]);
    let friends = userRes.rows[0]?.friends || [];

    friends = friends.filter((f: number) => f !== friendId);
    const updateQuery = 'UPDATE users SET friends = $1 WHERE id = $2 RETURNING *';
    const updatedUser = await pool.query(updateQuery, [friends, user.id]);
    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/is-following/:friendId', async (req, res) => {
  interface MinimalUser {
    id: number;
  }

  const user = req.user as MinimalUser | undefined;
  const friendId = parseInt(req.params.friendId, 10);

  if (!user || !user.id || !friendId) {
    return res.status(400).send('Invalid data');
  }

  try {
    const userQuery = 'SELECT friends FROM users WHERE id = $1';
    const userRes = await pool.query(userQuery, [user.id]);
    const friends = userRes.rows[0]?.friends || [];

    const isFollowing = friends.includes(friendId);
    res.json({ isFollowing });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/user-friends', async (req, res) => {
  interface MinimalUser {
    id: number;
  }
  const user = req.user as MinimalUser | undefined;

  if (!user || !user.id) {
    return res.status(401).json({ message: 'User not logged in.' });
  }

  try {
    const friendsQuery = 'SELECT friends FROM users WHERE id = $1';
    const friendsRes = await pool.query(friendsQuery, [user.id]);
    const friendIds = friendsRes.rows[0].friends;

    const userDetailsQuery = 'SELECT id, username, profile_image_url FROM users WHERE id = ANY($1)';
    const userDetailsRes = await pool.query(userDetailsQuery, [friendIds]);
    res.json(userDetailsRes.rows);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/search-users', async (req, res) => {
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

app.get('/user-groups', async (req, res) => {
  interface MinimalUser {
    id: number;
  }
  const user = req.user as MinimalUser | undefined;

  if (!user || !user.id) {
    return res.status(401).json({ message: 'User not logged in.' });
  }

  try {
    const query = `
      SELECT DISTINCT g.id, g.name
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1 OR g.owner_id = $1;
    `;
    const result = await pool.query(query, [user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/user/:userId/eligible-groups', async (req, res) => {
  interface MinimalUser {
    id: number;
  }
  const loggedInUser = req.user as MinimalUser | undefined;
  
  if (!loggedInUser || typeof loggedInUser.id !== 'number') {
    return res.status(401).json({ message: 'User not logged in.' });
  }
  const loggedInUserId = loggedInUser.id;
  console.log(`User ${loggedInUserId}`)

  const profileUserId = parseInt(req.params.userId, 10);
  console.log(`User ${profileUserId}`)
  if (isNaN(profileUserId)) {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }
  try {
    const query = `
      SELECT g.id, g.name
      FROM groups g
      WHERE g.owner_id = $1 AND NOT EXISTS (
        SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = $2
      );
    `;
    const result = await pool.query(query, [loggedInUserId, profileUserId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching eligible groups:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/group/:groupId/add-member', async (req, res) => {
  const groupId = parseInt(req.params.groupId, 10);
  const userIdToAdd = parseInt(req.body.userId, 10);

  if (isNaN(groupId) || isNaN(userIdToAdd)) {
    return res.status(400).send('Invalid data');
  }
  interface MinimalUser {
    id: number;
  }
  const loggedInUser = req.user as MinimalUser | undefined;
  
  if (!loggedInUser || typeof loggedInUser.id !== 'number') {
    return res.status(401).json({ message: 'User not logged in.' });
  }
  const loggedInUserId = loggedInUser.id;

  try {
    const ownerCheckQuery = 'SELECT owner_id FROM groups WHERE id = $1';
    const ownerCheckResult = await pool.query(ownerCheckQuery, [groupId]);
    if (ownerCheckResult.rows.length === 0 || ownerCheckResult.rows[0].owner_id !== loggedInUserId) {
      return res.status(403).json({ message: 'Only the group owner can add members.' });
    }

    const checkQuery = 'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2';
    const checkResult = await pool.query(checkQuery, [groupId, userIdToAdd]);
    if (checkResult.rows.length > 0) {
      return res.status(409).send('User is already a member of this group');
    }

    const insertQuery = 'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) RETURNING *';
    const insertResult = await pool.query(insertQuery, [groupId, userIdToAdd]);
    res.json(insertResult.rows[0]);
  } catch (error) {
    console.error('Error adding user to group:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/group/:groupId/remove-member', async (req, res) => {
  const groupId = parseInt(req.params.groupId, 10);
  const userIdToRemove = parseInt(req.body.userId, 10);
  const userIdRequesting = parseInt(req.body.requestingUserId, 10); // Add requesting user's ID

  if (!groupId || !userIdToRemove) {
    return res.status(400).send('Invalid data');
  }

  try {
    const ownerCheckQuery = 'SELECT owner_id FROM groups WHERE id = $1';
    const ownerCheckResult = await pool.query(ownerCheckQuery, [groupId]);
    if (ownerCheckResult.rows[0].owner_id !== userIdRequesting) {
      return res.status(403).send('Forbidden: Only group owner can remove members');
    }

    const query = 'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING *';
    const result = await pool.query(query, [groupId, userIdToRemove]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error removing user from group:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/group/:groupId/details', async (req, res) => {
  const groupId = parseInt(req.params.groupId, 10);

  if (!groupId) {
    return res.status(400).send('Invalid group ID');
  }

  try {
    const groupQuery = `SELECT name, owner_id FROM groups WHERE id = $1;`;
    const groupResult = await pool.query(groupQuery, [groupId]);
    const groupName = groupResult.rows[0]?.name;
    const ownerId = groupResult.rows[0]?.owner_id;

    const membersQuery = `
      SELECT u.id, u.username, u.profile_image_url
      FROM users u
      WHERE u.id IN (
        SELECT user_id FROM group_members WHERE group_id = $1
      );
    `;
    const membersResult = await pool.query(membersQuery, [groupId]);

    const ownerQuery = `SELECT id, username, profile_image_url FROM users WHERE id = $1;`;
    const ownerResult = await pool.query(ownerQuery, [ownerId]);

    const gamesQuery = `
      SELECT DISTINCT g.*
      FROM games g
      INNER JOIN users u ON g.id = ANY(u.owned_games)
      WHERE u.id IN (
        SELECT user_id FROM group_members WHERE group_id = $1
        UNION
        SELECT owner_id FROM groups WHERE id = $1
      );
    `;
    const gamesResult = await pool.query(gamesQuery, [groupId]);

    res.json({
      name: groupName,
      owner: ownerResult.rows[0],
      members: membersResult.rows,
      games: gamesResult.rows
    });
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/rate-game', async (req, res) => {
  interface MinimalUser {
    id: number;
  }

  const user = req.user as MinimalUser | undefined;
  const gameId = parseInt(req.body.gameId, 10);
  const rating = parseInt(req.body.rating, 10);

  // Check if user is not authenticated
  if (!req.isAuthenticated() || !user) {
    return res.status(401).send('User not logged in');
  }

  if (!user.id || !gameId || isNaN(rating) || rating < 1 || rating > 10) {
    return res.status(400).send('Invalid data');
  }

  try {
    // Check if user has already rated the game
    const ratingCheckQuery = 'SELECT rating FROM user_game_ratings WHERE user_id = $1 AND game_id = $2';
    const ratingCheckRes = await pool.query(ratingCheckQuery, [user.id, gameId]);
    const existingRating = ratingCheckRes.rows[0]?.rating;

    const upsertRatingQuery = `
      INSERT INTO user_game_ratings (user_id, game_id, rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, game_id) 
      DO UPDATE SET rating = EXCLUDED.rating;
    `;
    await pool.query(upsertRatingQuery, [user.id, gameId, rating]);

    let updateGameRatingQuery = '';
    if (existingRating) {
      updateGameRatingQuery = `
        UPDATE games
        SET total_rating_score = total_rating_score - $1 + $2
        WHERE id = $3;
      `;
      await pool.query(updateGameRatingQuery, [existingRating, rating, gameId]);
    } else {
      updateGameRatingQuery = `
        UPDATE games
        SET total_rating_score = total_rating_score + $1,
            rating_count = rating_count + 1
        WHERE id = $2;
      `;
      await pool.query(updateGameRatingQuery, [rating, gameId]);
    }

    res.send('Rating updated successfully');
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/user-rating/:gameId', async (req, res) => {
  interface MinimalUser {
    id: number;
  }
  const user = req.user as MinimalUser | undefined;
  const gameId = parseInt(req.params.gameId, 10);

  if (!user || !user.id) {
    return res.status(401).json({ message: 'User not logged in.' });
  }

  if (!gameId) {
    return res.status(400).send('Invalid game ID');
  }

  try {
    const ratingQuery = 'SELECT rating FROM user_game_ratings WHERE user_id = $1 AND game_id = $2';
    const ratingRes = await pool.query(ratingQuery, [user.id, gameId]);
    const userRating = ratingRes.rows[0] ? ratingRes.rows[0].rating : null;

    res.json({ rating: userRating });
  } catch (error) {
    console.error('Error fetching user rating:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/remove-rating/:gameId', async (req, res) => {
  interface MinimalUser {
    id: number;
  }
  const user = req.user as MinimalUser | undefined;
  const gameId = parseInt(req.params.gameId, 10);

  if (!user || !user.id) {
    return res.status(401).send('User not logged in');
  }

  if (!gameId) {
    return res.status(400).send('Invalid game ID');
  }

  try {
    // Check if user has rated the game
    const ratingCheckQuery = 'SELECT rating FROM user_game_ratings WHERE user_id = $1 AND game_id = $2';
    const ratingCheckRes = await pool.query(ratingCheckQuery, [user.id, gameId]);
    const existingRating = ratingCheckRes.rows[0]?.rating;

    if (existingRating) {
      // Delete the rating
      const deleteRatingQuery = 'DELETE FROM user_game_ratings WHERE user_id = $1 AND game_id = $2';
      await pool.query(deleteRatingQuery, [user.id, gameId]);

      // Update the game's total rating score and count
      const updateGameRatingQuery = `
        UPDATE games
        SET total_rating_score = total_rating_score - $1,
            rating_count = rating_count - 1
        WHERE id = $2;
      `;
      await pool.query(updateGameRatingQuery, [existingRating, gameId]);
    }

    res.send('Rating removed successfully');
  } catch (error) {
    console.error('Error removing rating:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/create-group', async (req, res) => {
  interface MinimalUser {
    id: number;
  }
  const user = req.user as MinimalUser | undefined;

  if (!user || !user.id) {
    return res.status(401).json({ message: 'User not logged in.' });
  }

  const { groupName } = req.body;

  try {
    const createGroupQuery = `
      INSERT INTO groups (name, owner_id)
      VALUES ($1, $2)
      RETURNING *;`;

    const result = await pool.query(createGroupQuery, [groupName, user.id]);
    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.delete('/delete-group/:groupId', async (req, res) => {
  const groupId = parseInt(req.params.groupId, 10);

  if (!groupId) {
    return res.status(400).json({ message: 'Invalid group ID.' });
  }

  try {
    const deleteMembersQuery = 'DELETE FROM group_members WHERE group_id = $1';
    await pool.query(deleteMembersQuery, [groupId]);

    const deleteGroupQuery = 'DELETE FROM groups WHERE id = $1';
    await pool.query(deleteGroupQuery, [groupId]);

    res.json({ message: 'Group deleted successfully.' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).send('Internal Server Error');
  }
});

async function saveMessage(groupId: number, userId: number, message: string) {
  const insertQuery = `
    INSERT INTO group_messages (group_id, user_id, message)
    VALUES ($1, $2, $3)
    RETURNING *;`; // Returning the inserted row for confirmation

  try {
    const result = await pool.query(insertQuery, [groupId, userId, message]);
    console.log('Message saved:', result.rows[0]);
    return result.rows[0]; // Return the saved message
  } catch (error) {
    console.error('Error saving message:', error);
    throw error; // Rethrow the error for upstream error handling
  }
}

async function getUserById(userId: number) {
  const query = `SELECT username FROM users WHERE id = $1;`;
  try {
    const result = await pool.query(query, [userId]);
    if (result.rows.length > 0) {
      return result.rows[0]; // returns the user object
    } else {
      return null; // user not found
    }
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
}

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinGroup', async (groupId, userId) => {
    socket.join(groupId);
    console.log(`User ${userId} joined group ${groupId}`);

    // Optionally, send chat history to the user
    const messages = await fetchGroupMessages(groupId);
    socket.emit('chatHistory', messages);
  });

  socket.on('sendMessage', async (message, groupId, userId) => {
    try {
      const savedMessage = await saveMessage(groupId, userId, message); // Save message to database
      
      const user = await getUserById(userId);
      const username = user ? user.username : "Unknown User";
  
      const messageWithUsername = { ...savedMessage, username };
      
      io.to(groupId).emit('receiveMessage', messageWithUsername);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });
  

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

async function fetchGroupMessages(groupId: number) {
  const selectQuery = `
    SELECT gm.message, gm.timestamp, u.username
    FROM group_messages gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = $1
    ORDER BY gm.timestamp ASC;`; // Adjusted to include username from the users table

  try {
    const result = await pool.query(selectQuery, [groupId]);
    console.log('Fetched messages for group:', groupId);
    return result.rows; // Returns an array of messages with usernames
  } catch (error) {
    console.error('Error fetching group messages:', error);
    throw error;
  }
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});