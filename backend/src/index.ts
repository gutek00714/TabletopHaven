import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import express from "express";
import passport from 'passport';
import './googleAuth/passport-setup';
import cors from 'cors';
import { authGoogle, authGoogleCallback, logout, checkLoginStatus } from './googleAuth/auth';
import gameRoutes from './gamesControllers/gameRoutes';
import shelfRoutes from './shelfControllers/shelfRoutes';
import userRoutes from './userControllers/userRoutes';
import groupRoutes from './groupControllers/groupRoutes';
import useSession from './db/useSession';
import initializeSocketIO from './chatControllers/chatControllers';

const PORT = 3000;
const app = express();

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:8081", // Match this to the frontend URL
    methods: ["GET", "POST"], // Adjust according to the methods you need
    credentials: true
  }
});

app.use(express.static('public'));
app.use(express.json());
app.use(useSession);
app.use(cors({
  origin: 'http://localhost:8081', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // allow these methods
  allowedHeaders: ['Content-Type', 'Authorization'] // allow these headers
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/google', authGoogle);
app.get('/auth/google/callback', authGoogleCallback);
app.get('/logout', logout);
app.get('/check-login-status', checkLoginStatus);

app.use(gameRoutes);
app.use(shelfRoutes);
app.use(userRoutes);
app.use(groupRoutes);
initializeSocketIO(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});