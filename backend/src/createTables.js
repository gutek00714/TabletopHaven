const db = require('./db');

async function createTables() {
    try {
        await db.none(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                owned_games INTEGER[]
                wishlist INTEGER[]
                favorites INTEGER[]
            );

            CREATE TABLE games (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                publisher VARCHAR(255) NOT NULL,
                categories INTEGER[],
                rating FLOAT,
                play_time VARCHAR(20),
                age INT,
                foreign_names VARCHAR(255)[]
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
