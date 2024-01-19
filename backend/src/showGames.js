const db = require('./db'); // Ensure this points to your database configuration module

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
