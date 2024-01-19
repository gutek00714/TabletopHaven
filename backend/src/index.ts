import http from "node:http";
import express from "express";
import session from 'express-session';
import passport from 'passport';
import './passport-setup';
import cors from 'cors';
import { bggAPI } from "./controllers/bggAPI";

const PORT = 3000;
const app = express();

app.use(express.static('public'));
app.use(cors());
app.use(bggAPI);

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google Auth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { 
      failureRedirect: 'http://localhost:8081/fail' // Redirect to Vue.js fail route
  }),
  (req, res) => {
    // Successful authentication, redirect to Vue.js success route
    res.redirect('http://localhost:8081/success');
  });

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error during logout');
      return;
    }
    res.redirect('/login.html');
  });
});

http.createServer(app).listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
