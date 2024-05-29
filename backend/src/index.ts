import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import express from "express";
import session from 'express-session';
import passport from 'passport';
import './googleAuth/passport-setup';
import cors from 'cors';

import { authGoogle, authGoogleCallback, logout, checkLoginStatus } from './googleAuth/auth';
import gameRoutes from './gamesControllers/gameRoutes';
import shelfRoutes from './shelfControllers/shelfRouters';
import userRouter from './userControllers/userRoutes';

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
app.use(userRouter);


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

  interface MinimalUser {
    id: number;
  }
  const user = req.user as MinimalUser | undefined;
  if (!user || !user.id) {
    return res.status(401).json({ message: 'User not logged in.' });
  }

  try {
    const checkOwnershipQuery = 'SELECT owner_id FROM groups WHERE id = $1';
    const ownershipResult = await pool.query(checkOwnershipQuery, [groupId]);

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const ownerId = ownershipResult.rows[0].owner_id;

    if (user.id !== ownerId) {
      return res.status(403).json({ message: 'You are not authorized to delete this group.' });
    }
    
    const deleteVotesQuery = `
    DELETE FROM event_game_votes
    USING calendar_events
    WHERE calendar_events.id = event_game_votes.event_id
    AND calendar_events.group_id = $1;
  `;

  await pool.query(deleteVotesQuery, [groupId]);
    const deleteEventsQuery = 'DELETE FROM calendar_events WHERE group_id = $1';
    await pool.query(deleteEventsQuery, [groupId]);

    const deleteMembersQuery = 'DELETE FROM group_members WHERE group_id = $1';
    await pool.query(deleteMembersQuery, [groupId]);

    const deleteMessagesQuery = 'DELETE FROM group_messages WHERE group_id = $1';
    await pool.query(deleteMessagesQuery, [groupId]);

    const deleteGroupQuery = 'DELETE FROM groups WHERE id = $1';
    await pool.query(deleteGroupQuery, [groupId]);

    res.json({ message: 'Group deleted successfully.' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/group/:groupId/create-event', async (req, res) => {
  interface MinimalUser {
    id: number;
  }
  const user = req.user as MinimalUser | undefined;
  if (!user || !user.id) {
    return res.status(401).json({ message: 'User not logged in.' });
  }

  const groupId = req.params.groupId;
  const { eventName, eventDate} = req.body;

  try {
    const createEventQuery = `
      INSERT INTO calendar_events (group_id, name, date)
      VALUES ($1, $2, $3)
      RETURNING *;`;

    const result = await pool.query(createEventQuery, [groupId, eventName, eventDate]);
    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/group/:groupId/events', async (req, res) => {
  const groupId = req.params.groupId;

  try {
    const getEventsQuery = `
      SELECT * FROM calendar_events
      WHERE group_id = $1;`;

    const events = await pool.query(getEventsQuery, [groupId]);
    res.json(events.rows);

  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/event/:eventId/vote-for-game', async (req, res) => {
  interface MinimalUser {
    id: number;
  }
  console.log(req.body);
  const user = req.user as MinimalUser | undefined;
  const { eventId, gameId } = req.body;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).send('User not logged in');
  }

  if (!eventId || !gameId) {
    return res.status(400).send('Invalid data');
  }

  try {
    const voteCheckQuery = 'SELECT 1 FROM event_game_votes WHERE event_id = $1 AND game_id = $2 AND user_id = $3';
    const voteCheckRes = await pool.query(voteCheckQuery, [eventId, gameId, user.id]);
    
    if ((voteCheckRes.rowCount as number) > 0) {
      const deleteVoteQuery = 'DELETE FROM event_game_votes WHERE event_id = $1 AND game_id = $2 AND user_id = $3';
      await pool.query(deleteVoteQuery, [eventId, gameId, user.id]);
      res.send('Vote deleted successfully');
    }
    else{
      const insertVoteQuery = 'INSERT INTO event_game_votes (event_id, game_id, user_id) VALUES ($1, $2, $3)';
      await pool.query(insertVoteQuery, [eventId, gameId, user.id]);
      res.send('Vote registered successfully');
    }

    app.get('/event/:eventId/games-votes', async (req, res) => {
      const eventId = parseInt(req.params.eventId, 10);
    
      if (!eventId) {
        return res.status(400).send('Invalid event ID');
      }
    
      try {
        const getVotesQuery = `
          SELECT game_id, COUNT(*) AS vote_count
          FROM event_game_votes
          WHERE event_id = $1
          GROUP BY game_id;
        `;
    
        const votesResult = await pool.query(getVotesQuery, [eventId]);
        res.json(votesResult.rows);
    
      } catch (error) {
        console.error('Error fetching votes for games:', error);
        res.status(500).send('Internal Server Error');
      }
    });


  } catch (error) {
    console.error('Error registering vote:', error);
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