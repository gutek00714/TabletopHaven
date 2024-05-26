import { Router } from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';

const router = Router();
require('dotenv').config();
const PgSession = pgSession(session);
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET is not set');
}

router.use(session({
    store: new PgSession({
      pool: new Pool({ // Use node-postgres Pool
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432', 10)
      }),
      tableName: 'session' // optional, default is 'session'
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days for example
  }));

export default router;