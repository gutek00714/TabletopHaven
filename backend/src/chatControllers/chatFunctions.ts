import pool from '../db/pool';

export async function saveMessage(groupId: number, userId: number, message: string) {
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

export async function fetchGroupMessages(groupId: number) {
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

export async function getUserById(userId: number) {
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
