import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import express from "express";
import session from 'express-session';
import passport from 'passport';
import './googleAuth/passport-setup';
import cors from 'cors';

import { authGoogle, authGoogleCallback, logout, checkLoginStatus } from './googleAuth/auth';
import gameRoutes from './gamesControllers/gameRoutes';
import shelfRoutes from './shelfControllers/shelfRoutes';
import userRoutes from './userControllers/userRoutes';
import groupRoutes from './groupControllers/groupRoutes';

import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';
import pool from './db/pool';

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

app.get('/auth/google', authGoogle);
app.get('/auth/google/callback', authGoogleCallback);
app.get('/logout', logout);
app.get('/check-login-status', checkLoginStatus);

app.use(gameRoutes);
app.use(shelfRoutes);
app.use(userRoutes);
app.use(groupRoutes);


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