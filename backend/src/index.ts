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

http.createServer(app).listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
