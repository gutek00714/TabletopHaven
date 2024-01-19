import axios from "axios";
import express, {Request, Response} from "express";
import xml2js from "xml2js";

const bggAPI= express.Router();
const xmlParser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

bggAPI.get("/search/:query", async (req: Request, res: Response) => {
  try {
    const {query} = req.params;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Invalid query parameter" });
    }

    const apiUrl = `https://boardgamegeek.com/xmlapi2/search?query=${query}&type=boardgame`;
    const response = await axios.get(apiUrl);
    xmlParser.parseString(response.data, (err, result) => {
        if (err) {
          console.error("Error parsing XML:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
  
        const customResponse = customizeResponse(result);
        
        res.status(200).json(customResponse);
      });
  } catch (error) {
    console.error("Error in bggAPI:", error);
    res.status(500).json({error: "Internal server error" });
  }
});

function customizeResponse(data: any): any {
    // Check if array is empty
    if (!data.items || !data.items.item || !Array.isArray(data.items.item)) {
      return { Boardgames: ["We couldn't find anything"] }; // Return an empty array or any other default value
    }
  // Config to what we want to extract from JSON
  const customizedData = {
    Boardgames: data.items.item.map((item: any) => ({
      id: item.id ? item.id : "",
      name: item.name.value ? item.name.value : "",
      yearpublished: item.yearpublished && item.yearpublished.value ? item.yearpublished.value : "",
    })),
  };

  return customizedData;
}

export {bggAPI};