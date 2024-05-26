import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.post('/group/:groupId/add-member', async (req, res) => {
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
  

export default router;