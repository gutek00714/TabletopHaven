import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.post('/group/:groupId/remove-member', async (req, res) => {
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

export default router;