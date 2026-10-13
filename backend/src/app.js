import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import giveawayRoutes from './routes/giveawayRoutes.js';
import participationRoutes from './routes/participationRoutes.js';
import winnerRoutes from './routes/winnerRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

// CORS configuration (Req #45: strict & configurable, not wild open cors(*) in production)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:4173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS security policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-device-hash', 'x-user-id']
  })
);

// Payload size limit to prevent payload flooding
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Logging
app.use(morgan('dev'));

// API Routes
app.use('/api/giveaways', giveawayRoutes);
app.use('/api/giveaways', participationRoutes);
app.use('/api/giveaways', winnerRoutes);
app.use('/api/giveaways', claimRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Root health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'VELOOP Rewards Giveaway API',
    version: '1.0.0'
  });
});

// Centralized 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.originalUrl} does not exist.`
    }
  });
});

// Centralized Error Middleware
app.use(errorHandler);

export default app;
