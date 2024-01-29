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

app.use(cors({
  origin: 'http://localhost:8081', // Your frontend URL
  credentials: true
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
  const gameId = parseInt(req.params.gameId, 10);
  if (!gameId) {
    return res.status(400).send('Invalid game ID');
  }

  try {
    const gameDetails = await getGameDetails(gameId);
    if (!gameDetails) {
      return res.status(404).send('Game not found');
    }
    res.json(gameDetails);
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

http.createServer(app).listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
