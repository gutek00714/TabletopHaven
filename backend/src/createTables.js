const path = require('path');
const dotenvPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: dotenvPath });
const db = require('./db');

async function createTables() {
    try {
        await db.none(`
            DROP TABLE IF EXISTS users CASCADE;
            DROP TABLE IF EXISTS games CASCADE;

            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                googleId VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(255),
                owned_games INTEGER[],
                wishlist INTEGER[],
                favorites INTEGER[]
            );

            CREATE TABLE games (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                publisher VARCHAR(255)[],
                categories VARCHAR(255)[],
                rating FLOAT,
                play_time VARCHAR(20),
                age INT,
                foreign_names VARCHAR(255)[],
                bgg_id INT
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
