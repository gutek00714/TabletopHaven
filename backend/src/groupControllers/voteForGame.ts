import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.post('/event/:eventId/vote-for-game', async (req, res) => {
    interface MinimalUser {
      id: number;
    }
    const user = req.user as MinimalUser | undefined;
    const { eventId, gameId } = req.body;
  
    if (!req.isAuthenticated() || !user) {
      return res.status(401).send('User not logged in');
    }
  
    if (!eventId || !gameId) {
      return res.status(400).send('Invalid data');
    }
  
    try {
      const voteCheckQuery = 'SELECT 1 FROM event_game_votes WHERE event_id = $1 AND game_id = $2 AND user_id = $3';
      const voteCheckRes = await pool.query(voteCheckQuery, [eventId, gameId, user.id]);
      
      if ((voteCheckRes.rowCount as number) > 0) {
        const deleteVoteQuery = 'DELETE FROM event_game_votes WHERE event_id = $1 AND game_id = $2 AND user_id = $3';
        await pool.query(deleteVoteQuery, [eventId, gameId, user.id]);
        res.send('Vote deleted successfully');
      }
      else{
        const insertVoteQuery = 'INSERT INTO event_game_votes (event_id, game_id, user_id) VALUES ($1, $2, $3)';
        await pool.query(insertVoteQuery, [eventId, gameId, user.id]);
        res.send('Vote registered successfully');
      }
  
      router.get('/event/:eventId/games-votes', async (req, res) => {
        const eventId = parseInt(req.params.eventId, 10);
      
        if (!eventId) {
          return res.status(400).send('Invalid event ID');
        }
      
        try {
          const getVotesQuery = `
            SELECT game_id, COUNT(*) AS vote_count
            FROM event_game_votes
            WHERE event_id = $1
            GROUP BY game_id;
          `;
      
          const votesResult = await pool.query(getVotesQuery, [eventId]);
          res.json(votesResult.rows);
      
        } catch (error) {
          console.error('Error fetching votes for games:', error);
          res.status(500).send('Internal Server Error');
        }
      });
  
  
    } catch (error) {
      console.error('Error registering vote:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
export default router;