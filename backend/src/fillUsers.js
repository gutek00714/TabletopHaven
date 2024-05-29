const path = require('path');
const dotenvPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: dotenvPath });
const db = require('./db');
// Function to generate an array of random game IDs
function generateRandomGameIds(count, maxId) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * maxId) + 1);
}

// Function to create a single user
async function createUser(userId) {
  try {
      let googleId = userId.toString();
      let existingUser = await db.oneOrNone('SELECT id FROM users WHERE googleId = $1', googleId);
      // If the Google ID already exists, generate a new one until it's unique
      while (existingUser) {
          userId++; // Increment userId
          googleId = userId.toString(); // Update Google ID
          existingUser = await db.oneOrNone('SELECT id FROM users WHERE googleId = $1', googleId);
      }

      // Generate other random data
      const ownedGames = generateRandomGameIds(Math.floor(Math.random() * 10) + 1, 200);
      const wishlist = generateRandomGameIds(Math.floor(Math.random() * 10) + 1, 200);
      const favorites = generateRandomGameIds(Math.floor(Math.random() * 10) + 1, 200);
      const uniqueImageUrl = `https://lh3.googleusercontent.com/a/ACg8ocKlxn9GIhFaQuclsk9Oz6ffLGKNjQVhqr3-IJUrZ4u8=s96-c`;

      // Insert the user with the unique Google ID
      await db.none(
          'INSERT INTO users (googleId, email, username, owned_games, wishlist, favorites, profile_image_url) ' +
          'VALUES (${googleId}, ${email}, ${username}, ${owned_games}, ${wishlist}, ${favorites}, ${profile_image_url})',
          {
              googleId: googleId,
              email: `user${userId}@example.com`,
              username: `User${userId}`,
              owned_games: ownedGames,
              wishlist: wishlist,
              favorites: favorites,
              profile_image_url: uniqueImageUrl
          }
      );
      console.log(`User ${userId} added.`);
  } catch (error) {
      console.error('Error adding user to database:', error);
  }
}

async function fillUsersTable() {
    try {
        for (let i = 1; i <= 50; i++) {
            await createUser(i);
        }
    } catch (error) {
        console.error('Error filling users table:', error);
    } finally {
        db.$pool.end(); // Close the connection pool
    }
}

fillUsersTable();
