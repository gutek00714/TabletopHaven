const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    // Check if user already exists in our database
    const existingUser = await db.oneOrNone('SELECT * FROM users WHERE googleId = $1', [profile.id]);

    if (existingUser) {
      // User already exists
      done(null, existingUser);
    } else {
      // If not, create a new user in our database
      const newUser = await db.one('INSERT INTO users (googleId, email, username) VALUES ($1, $2, $3) RETURNING *', 
        [profile.id, profile.emails[0].value, profile.displayName]);
      done(null, newUser);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.one('SELECT * FROM users WHERE id = $1', [id])
    .then(user => done(null, user))
    .catch(err => done(err, null));
});
