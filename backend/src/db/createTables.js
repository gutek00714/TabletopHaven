const path = require('path');
const dotenvPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: dotenvPath });
const db = require('./db');

async function createTables() {
  try {
      await db.none(`
            DROP TABLE IF EXISTS users CASCADE;
            DROP TABLE IF EXISTS games CASCADE;
            DROP TABLE IF EXISTS user_game_ratings CASCADE;
            DROP TABLE IF EXISTS session CASCADE;
            DROP TABLE IF EXISTS groups CASCADE;
            DROP TABLE IF EXISTS group_members CASCADE;
            DROP TABLE IF EXISTS group_messages CASCADE;
            DROP TABLE IF EXISTS calendar_events CASCADE;
            DROP TABLE IF EXISTS event_game_votes CASCADE;


          CREATE TABLE users (
              id SERIAL PRIMARY KEY,
              googleId VARCHAR(255) UNIQUE NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              username VARCHAR(255),
              owned_games INTEGER[],
              wishlist INTEGER[],
              favorites INTEGER[],
              friends INTEGER[],
              profile_image_url VARCHAR(255) NOT NULL
          );

          CREATE TABLE games (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            publisher VARCHAR(255)[],
            year INT,
            description TEXT,
            categories VARCHAR(255)[],
            total_rating_score INT DEFAULT 0,
            rating_count INT DEFAULT 0,
            min_players INT,
            max_players INT,
            play_time INT,
            age INT,
            foreign_names VARCHAR(255)[],
            image VARCHAR(255),
            bgg_id INT
        );
          
          CREATE TABLE user_game_ratings (
              user_id INTEGER REFERENCES users(id),
              game_id INTEGER REFERENCES games(id),
              rating INT,
              PRIMARY KEY (user_id, game_id)
          );

          CREATE TABLE groups (
            id SERIAL PRIMARY KEY,
            name VARCHAR(30) UNIQUE NOT NULL,
            owner_id INTEGER REFERENCES users(id)
          );

          CREATE TABLE group_members (
              group_id INTEGER REFERENCES groups(id),
              user_id INTEGER REFERENCES users(id),
              PRIMARY KEY (group_id, user_id)
            );

          CREATE TABLE calendar_events (
              id SERIAL PRIMARY KEY,
              group_id INTEGER REFERENCES groups(id),
              name VARCHAR(30),
              date TIMESTAMP
          );

          CREATE TABLE event_game_votes (
            event_id INTEGER REFERENCES calendar_events(id),
            game_id INTEGER REFERENCES games(id),
            user_id INTEGER REFERENCES users(id),
            PRIMARY KEY (event_id, game_id, user_id)
          );

          CREATE TABLE session (
              sid varchar NOT NULL COLLATE "default",
              sess json NOT NULL,
              expire timestamp(6) NOT NULL
          )
          WITH (OIDS=FALSE);

          ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;

          CREATE TABLE group_messages (
              id SERIAL PRIMARY KEY,
              group_id INTEGER REFERENCES groups(id),
              user_id INTEGER REFERENCES users(id),
              message TEXT NOT NULL,
              timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      `);
      console.log('Tables created successfully.');
  } catch (error) {
      console.error('Error creating tables:', error);
  } finally {
      db.$pool.end(); // Close the connection pool
  }
}

createTables();
