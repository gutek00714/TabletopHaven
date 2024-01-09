import http from "node:http";
import express from "express";
import session from 'express-session';
import passport from 'passport';
import './passport-setup';

const PORT = 3000;
const app = express();


app.use(express.static('public'));

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
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
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
