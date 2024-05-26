import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/group/:groupId/details', async (req, res) => {
    const groupId = parseInt(req.params.groupId, 10);
  
    if (!groupId) {
      return res.status(400).send('Invalid group ID');
    }
  
    try {
      const groupQuery = `SELECT name, owner_id FROM groups WHERE id = $1;`;
      const groupResult = await pool.query(groupQuery, [groupId]);
      const groupName = groupResult.rows[0]?.name;
      const ownerId = groupResult.rows[0]?.owner_id;
  
      const membersQuery = `
        SELECT u.id, u.username, u.profile_image_url
        FROM users u
        WHERE u.id IN (
          SELECT user_id FROM group_members WHERE group_id = $1
        );
      `;
      const membersResult = await pool.query(membersQuery, [groupId]);
  
      const ownerQuery = `SELECT id, username, profile_image_url FROM users WHERE id = $1;`;
      const ownerResult = await pool.query(ownerQuery, [ownerId]);
  
      const gamesQuery = `
        SELECT DISTINCT g.*
        FROM games g
        INNER JOIN users u ON g.id = ANY(u.owned_games)
        WHERE u.id IN (
          SELECT user_id FROM group_members WHERE group_id = $1
          UNION
          SELECT owner_id FROM groups WHERE id = $1
        );
      `;
      const gamesResult = await pool.query(gamesQuery, [groupId]);
  
      res.json({
        name: groupName,
        owner: ownerResult.rows[0],
        members: membersResult.rows,
        games: gamesResult.rows
      });
    } catch (error) {
      console.error('Error fetching group details:', error);
      res.status(500).send('Internal Server Error');
    }
  });

export default router;