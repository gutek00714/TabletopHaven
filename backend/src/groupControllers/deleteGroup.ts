import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.delete('/delete-group/:groupId', async (req, res) => {
    const groupId = parseInt(req.params.groupId, 10);
  
    if (!groupId) {
      return res.status(400).json({ message: 'Invalid group ID.' });
    }
  
    interface MinimalUser {
      id: number;
    }
    const user = req.user as MinimalUser | undefined;
    if (!user || !user.id) {
      return res.status(401).json({ message: 'User not logged in.' });
    }
  
    try {
      const checkOwnershipQuery = 'SELECT owner_id FROM groups WHERE id = $1';
      const ownershipResult = await pool.query(checkOwnershipQuery, [groupId]);
  
      if (ownershipResult.rows.length === 0) {
        return res.status(404).json({ message: 'Group not found.' });
      }
  
      const ownerId = ownershipResult.rows[0].owner_id;
  
      if (user.id !== ownerId) {
        return res.status(403).json({ message: 'You are not authorized to delete this group.' });
      }
      
      const deleteVotesQuery = `
      DELETE FROM event_game_votes
      USING calendar_events
      WHERE calendar_events.id = event_game_votes.event_id
      AND calendar_events.group_id = $1;
    `;
  
    await pool.query(deleteVotesQuery, [groupId]);
      const deleteEventsQuery = 'DELETE FROM calendar_events WHERE group_id = $1';
      await pool.query(deleteEventsQuery, [groupId]);
  
      const deleteMembersQuery = 'DELETE FROM group_members WHERE group_id = $1';
      await pool.query(deleteMembersQuery, [groupId]);
  
      const deleteMessagesQuery = 'DELETE FROM group_messages WHERE group_id = $1';
      await pool.query(deleteMessagesQuery, [groupId]);
  
      const deleteGroupQuery = 'DELETE FROM groups WHERE id = $1';
      await pool.query(deleteGroupQuery, [groupId]);
  
      res.json({ message: 'Group deleted successfully.' });
    } catch (error) {
      console.error('Error deleting group:', error);
      res.status(500).send('Internal Server Error');
    }
  });

export default router;