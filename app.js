const express = require('express');
const cors = require('cors');
const os = require('os');
const { db, admin } = require('./services/firebaseService');
const { logger, info, error, warn } = require('./utils/logger');
const loggingMiddleware = require('./middleware/loggingMiddleware');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const combatRoutes = require('./routes/combatRoutes');
const researchRoutes = require('./routes/researchRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const baseViraleRoutes = require('./routes/baseViraleRoutes');
const pathogenRoutes = require('./routes/pathogenRoutes');
const antibodyRoutes = require('./routes/antibodyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const progressionRoutes = require('./routes/progressionRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const threatScannerRoutes = require('./routes/threatScannerRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const multiplayerRoutes = require('./routes/multiplayerRoutes');
const syncRoutes = require('./routes/syncRoutes');

const app = express();

// --- Health Check with Retry ---
async function healthCheck(maxRetries = 3, delayMs = 5000) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      info('Starting health check', { attempt });

      // Check environment variables
      const requiredEnvVars = ['PORT', 'JWT_SECRET', 'GEMINI_API_KEY', 'FIREBASE_PROJECT_ID'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
      }
      info('Environment variables check: OK');

      // Test Firestore write
      await db.collection('status').doc('health_check').set({
        lastChecked: admin.firestore.FieldValue.serverTimestamp(),
        status: 'healthy',
      });
      info('Firestore write test: OK');

      // List Firestore collections
      const collections = await db.listCollections();
      info('Firestore connection: OK', {
        collections: collections.map(col => col.id),
      });

      return true;
    } catch (err) {
      lastError = err;
      warn(`Health check failed (attempt ${attempt}/${maxRetries})`, {
        error: err.message,
        stack: err.stack,
      });
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  error('Health check failed definitively', {
    error: lastError.message,
    stack: lastError.stack,
  });
  throw lastError;
}

// --- Update API URL in Firestore ---
async function updateApiUrlInFirestore(url, status) {
  try {
    await db.collection('config').doc('api').set({
      baseUrl: url,
      status: status,
      environment: process.env.NODE_ENV || 'production',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    info(`API URL updated in Firestore: ${url}`, { status });
  } catch (err) {
    error('Failed to update API URL in Firestore', {
      error: err.message,
      stack: err.stack,
    });
  }
}

// --- Global Middlewares ---
app.use(cors({
  origin: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(loggingMiddleware);
app.use(rateLimitMiddleware);

// --- Welcome Route ---
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Immuno-Warriors API!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    endpoints: routes.map(({ path }) => path),
  });
});

// --- Health Check Route ---
app.get('/api/health', async (req, res) => {
  try {
    await db.collection('status').doc('health_check').get();
    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    error('Health check failed', { error: err.message });
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// --- API Base Route ---
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Immuno-Warriors API!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    endpoints: routes.map(({ path }) => path),
  });
});

// --- Mount Routes ---
const routes = [
  { path: '/api/auth', router: authRoutes, baseMessage: 'Authentication API' },
  { path: '/api/user', router: userRoutes, baseMessage: 'Users API' },
  { path: '/api/combat', router: combatRoutes, baseMessage: 'Combat API' },
  { path: '/api/research', router: researchRoutes, baseMessage: 'Research API' },
  { path: '/api/gemini', router: geminiRoutes, baseMessage: 'Gemini AI API' },
  { path: '/api/base-virale', router: baseViraleRoutes, baseMessage: 'Viral Base API' },
  { path: '/api/pathogen', router: pathogenRoutes, baseMessage: 'Pathogens API' },
  { path: '/api/antibody', router: antibodyRoutes, baseMessage: 'Antibodies API' },
  { path: '/api/notification', router: notificationRoutes, baseMessage: 'Notifications API' },
  { path: '/api/memory', router: memoryRoutes, baseMessage: 'Immune Memory API' },
  { path: '/api/inventory', router: inventoryRoutes, baseMessage: 'Inventory API' },
  { path: '/api/progression', router: progressionRoutes, baseMessage: 'Progression API' },
  { path: '/api/achievement', router: achievementRoutes, baseMessage: 'Achievements API' },
  { path: '/api/threat-test', router: threatScannerRoutes, baseMessage: 'Threat Scanner API' },
  { path: '/api/leaderboard', router: leaderboardRoutes, baseMessage: 'Leaderboard API' },
  { path: '/api/multiplayer', router: multiplayerRoutes, baseMessage: 'Multiplayer API' },
  { path: '/api/sync', router: syncRoutes, baseMessage: 'Synchronization API' },
];

routes.forEach(({ path, router, baseMessage }) => {
  router.get('/', (req, res) => {
    res.status(200).json({
      message: baseMessage,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
    });
  });
  app.use(path, router);
  info(`Route mounted: ${path}`);
});

// --- Error Handling Middleware ---
app.use(errorMiddleware);

// --- Graceful Shutdown ---
let isShuttingDown = false;

process.on('SIGTERM', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  info('Received SIGTERM signal. Shutting down server...');
  try {
    await db.collection('status').doc('api_status').update({
      last_stopped: admin.firestore.FieldValue.serverTimestamp(),
      message: 'API stopped',
    });
    await updateApiUrlInFirestore(process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT}`, 'stopped');
  } catch (err) {
    error('Error during Firestore shutdown', { error: err.message });
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  info('Received SIGINT signal. Shutting down server...');
  try {
    await db.collection('status').doc('api_status').update({
      last_stopped: admin.firestore.FieldValue.serverTimestamp(),
      message: 'API stopped',
    });
    await updateApiUrlInFirestore(process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT}`, 'stopped');
  } catch (err) {
    error('Error during Firestore shutdown', { error: err.message });
  }
  process.exit(0);
});

// --- Unhandled Errors ---
process.on('unhandledRejection', (reason, promise) => {
  error('Unhandled Promise Rejection', {
    reason: reason.message || reason,
    stack: reason.stack,
    promise,
  });
});

process.on('uncaughtException', (err) => {
  error('Uncaught Exception', {
    error: err.message,
    stack: err.stack,
  });
  if (!isShuttingDown) {
    process.exit(1);
  }
});

// --- Start Server ---
async function startServer() {
  try {
    info('Starting server...');
    await healthCheck();

    const port = process.env.PORT || 4000;
    const ip = Object.values(os.networkInterfaces())
      .flat()
      .find(i => i.family === 'IPv4' && !i.internal)?.address || '0.0.0.0';
    const localUrl = `http://${ip}:${port}`;

    const server = app.listen(port, '0.0.0.0', async () => {
      info(`Server started on port ${port}`, {
        localUrl: `${localUrl}/api`,
        environment: process.env.NODE_ENV || 'production',
      });

      // Update Firestore with Render URL or local URL
      const apiUrl = process.env.RENDER_EXTERNAL_URL || localUrl;
      await updateApiUrlInFirestore(apiUrl, 'active');

      await db.collection('status').doc('api_status').set({
        last_started: admin.firestore.FieldValue.serverTimestamp(),
        message: 'API started',
        port,
        environment: process.env.NODE_ENV || 'production',
        ip,
        apiUrl,
      });
    });

    process.on('SIGTERM', () => server.close());
    process.on('SIGINT', () => server.close());
  } catch (err) {
    error('Failed to start server', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

startServer();

module.exports = app;