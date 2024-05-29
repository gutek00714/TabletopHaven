import { Router } from "express";

export const test = Router().get('/test', (_, res) => {
  res.send("Testowanko");
});