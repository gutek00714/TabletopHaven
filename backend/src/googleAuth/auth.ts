import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

export const authGoogle = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
};

export const authGoogleCallback = [
  passport.authenticate('google', {
    failureRedirect: 'http://localhost:8081' // Redirect to Vue.js fail route
  }),
  (req: Request, res: Response) => {
    // Successful authentication, redirect to Vue.js success route
    res.redirect('http://localhost:8081');
  }
];

export const logout = (req: Request, res: Response) => {
  //Info about logging user
  //console.log('Initiating logout for user:', req.user);
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Error during logout');
    }
    req.session.destroy(err => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).send('Could not log out');
      }
      // console.log('Session destroyed');
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out' });
    });
  });
};

export const checkLoginStatus = (req: Request, res: Response) => {
  //Info about logged user
  //console.log('Checking login status, user:', req.user);
  if (req.isAuthenticated()) {
    res.json({ isLoggedIn: true });
  } else {
    res.json({ isLoggedIn: false });
  }
};
