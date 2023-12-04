import http from "node:http";
import express from "express";

import {test} from "./controllers/test";

const PORT = 8080;

const app = express();

app.use(test);

http.createServer(app).listen(PORT, () => {
  console.log(`Server lisening on port ${PORT}`);
});