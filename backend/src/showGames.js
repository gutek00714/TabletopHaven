const path = require('path');
const dotenvPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: dotenvPath });
const db = require('./db');

async function displayAllGames() {
    try {
        const games = await db.any('SELECT * FROM games');
        console.log('All games in the database:');
        games.forEach(game => {
            console.log(game); // Adjust the output format as needed
        });
    } catch (error) {
        console.error('Error fetching games from database:', error);
    }
}

displayAllGames();
