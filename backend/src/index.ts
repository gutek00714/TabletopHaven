import http from "node:http";
import express from "express";

import {test} from "./controllers/test";

const PORT = 3000;

const app = express();
app.use(express.static('public'));

app.use(test);

http.createServer(app).listen(PORT, () => {
  console.log(`Server lisening on port ${PORT}`);
});