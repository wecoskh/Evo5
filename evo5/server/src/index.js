import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import campaignRoutes from './routes/campaigns.js';
import proposalRoutes from './routes/proposals.js';
import escrowRoutes from './routes/escrow.js';
import statsRoutes from './routes/stats.js';
import { seedDatabase } from './seedData.js';

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    if (NODE_ENV === 'production') {
      throw new Error('MONGO_URI is required in production');
    }
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mem = await MongoMemoryServer.create({ instance: { dbName: 'evo5' } });
    console.log('[db] started in-memory MongoDB (dev only)');
    await mongoose.connect(mem.getUri('evo5'));
    return true;
  }
  await mongoose.connect(uri);
  console.log('[db] connected to MongoDB');
  return false;
}

function createApp() {
  const app = express();

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
  }));

  app.use(compression());

  app.use(cors({
    origin: FRONTEND_URL === '*' ? true : FRONTEND_URL.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (NODE_ENV !== 'test') {
    app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: NODE_ENV === 'production' ? 1000 : 10000,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many authentication attempts, please try again later' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  app.get('/api/health', (_req, res) =>
    res.json({ ok: true, service: 'EvO5 API', time: new Date().toISOString(), env: NODE_ENV })
  );

  app.get('/api/ready', async (_req, res) => {
    const dbState = mongoose.connection.readyState;
    if (dbState === 1) {
      res.json({ ok: true, database: 'connected' });
    } else {
      res.status(503).json({ ok: false, database: 'disconnected' });
    }
  });

  app.get('/', (_req, res) => {
    res.type('html').send(`<!doctype html><meta charset="utf-8">
<title>EvO5 API</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#05060f;color:#eef1ff;font-family:system-ui,sans-serif;text-align:center">
<div>
  <h1 style="font-size:22px;margin:0 0 10px">EvO5 API is running</h1>
  <p style="color:#97a0c4;margin:0 0 6px">Environment: ${NODE_ENV}</p>
  <p style="color:#6b74a0;font-size:14px;margin:0">Frontend should be served separately.</p>
</div></body>`);
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/proposals', proposalRoutes);
  app.use('/api/escrow', escrowRoutes);
  app.use('/api/stats', statsRoutes);

  app.use((req, res) => res.status(404).json({ error: `No route ${req.method} ${req.path}` }));

  app.use((err, _req, res, _next) => {
    console.error('Server error:', err);
    const status = err.status || 500;
    const message = NODE_ENV === 'production' ? 'Internal server error' : err.message;
    res.status(status).json({ error: message });
  });

  return app;
}

async function main() {
  const isEphemeral = await connectMongo();

  const app = createApp();

  if (isEphemeral || process.env.SEED === 'true') {
    await seedDatabase();
  }

  const HOST = process.env.API_HOST || (NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
  const server = app.listen(PORT, HOST, () =>
    console.log(`[api] EvO5 API listening on ${HOST}:${PORT} (${NODE_ENV})`)
  );

  const shutdown = async (signal) => {
    console.log(`[api] ${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await mongoose.connection.close(false);
      console.log('[api] Database connection closed');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('[api] Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});