const path = require('path');
const dotenvPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: dotenvPath });
const db = require('./db');

async function createTables() {
    try {
        await db.none(`
            DROP TABLE IF EXISTS users CASCADE;
            DROP TABLE IF EXISTS games CASCADE;
            DROP TABLE IF EXISTS session CASCADE;

            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                googleId VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(255),
                owned_games INTEGER[],
                wishlist INTEGER[],
                favorites INTEGER[],
                friends INTEGER[]
            );

            CREATE TABLE games (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                publisher VARCHAR(255)[],
                year INT,
                description TEXT,
                categories VARCHAR(255)[],
                rating INTEGER[],
                min_players INT,
                max_players INT,
                play_time VARCHAR(20),
                age INT,
                foreign_names VARCHAR(255)[],
                image VARCHAR(255),
                bgg_id INT
            );

            CREATE TABLE session (
                sid varchar NOT NULL COLLATE "default",
                sess json NOT NULL,
                expire timestamp(6) NOT NULL
            )
            WITH (OIDS=FALSE);

            ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
        `);
        console.log('Tables created successfully.');
    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        db.$pool.end(); // Close the connection pool
    }
}

createTables();