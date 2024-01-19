import express from 'express';
import axios from 'axios';
import xml2js from 'xml2js';

const gameDetails = express.Router();
const xmlParser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

gameDetails.get('/details/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    const apiUrl = `https://boardgamegeek.com/xmlapi/boardgame/${id}`;
    const response = await axios.get(apiUrl);

    xmlParser.parseString(response.data, (err, result) => {
      if (err) {
        console.error('Error parsing XML:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.status(200).json(result);
    });
  } catch (error) {
    console.error('Error in gameDetails:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


export {gameDetails};
