const express = require('express');
const cors = require('cors');
const os = require('os');
const config = require('./config');
const { db, admin } = require('./services/firebaseService');
const { logger, info, error, warn } = require('./utils/logger');
const loggingMiddleware = require('./middleware/loggingMiddleware');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

// Importation des routes
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

// Port dynamique pour Render
const PORT = process.env.PORT || config.port;

// --- Vérifications de santé ---
async function healthCheck(maxRetries = 3, delayMs = 5000) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      info('Début de la vérification de santé', { attempt });

      const requiredEnvVars = ['JWT_SECRET', 'GEMINI_API_KEY', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_DATABASE_URL'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        throw new Error(`Variables d'environnement manquantes : ${missingVars.join(', ')}`);
      }
      info('Vérification des variables d\'environnement : OK');

      await db.collection('status').doc('health_check').set({
        lastChecked: admin.firestore.FieldValue.serverTimestamp(),
        status: 'healthy',
      });
      info('Écriture de test Firestore réussie');

      const collections = await db.listCollections();
      info('Connexion Firestore : OK', { collections: collections.map(col => col.id) });

      return true;
    } catch (err) {
      lastError = err;
      warn(`Échec de la vérification de santé (tentative ${attempt}/${maxRetries})`, {
        error: err.message,
        stack: err.stack,
      });
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  error('Échec définitif de la vérification de santé', {
    error: lastError.message,
    stack: lastError.stack,
  });
  throw lastError;
}

// --- Mettre à jour l'URL dans Firestore ---
async function updateApiUrlInFirestore(url, status) {
  try {
    await db.collection('config').doc('api').set({
      localUrl: url, // Stocke l'URL publique pour l'app mobile
      baseUrl: url,  // Gardé pour compatibilité, mais peut être identique à localUrl
      status: status,
      environment: process.env.NODE_ENV || 'development',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    info(`URL API mise à jour dans Firestore : ${url}`, { status });
  } catch (err) {
    error('Échec de la mise à jour de l\'URL dans Firestore', {
      error: err.message,
      stack: err.stack,
    });
  }
}

// --- Middlewares globaux ---
app.use(cors({
  origin: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : (process.env.NODE_ENV === 'production' ? 'https://immuno-warriors.com' : '*'),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(loggingMiddleware);
app.use(rateLimitMiddleware);

// --- Route d'accueil ---
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bienvenue sur l\'API Immuno-Warriors !',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: routes.map(({ path }) => path),
  });
});

// --- Montage des routes ---
const routes = [
  { path: '/api/auth', router: authRoutes, baseMessage: 'API Authentification' },
  { path: '/api/user', router: userRoutes, baseMessage: 'API Utilisateurs' },
  { path: '/api/combat', router: combatRoutes, baseMessage: 'API Combats' },
  { path: '/api/research', router: researchRoutes, baseMessage: 'API Recherche' },
  { path: '/api/gemini', router: geminiRoutes, baseMessage: 'API Gemini AI' },
  { path: '/api/base-virale', router: baseViraleRoutes, baseMessage: 'API Base Virale' },
  { path: '/api/pathogen', router: pathogenRoutes, baseMessage: 'API Pathogènes' },
  { path: '/api/antibody', router: antibodyRoutes, baseMessage: 'API Anticorps' },
  { path: '/api/notification', router: notificationRoutes, baseMessage: 'API Notifications' },
  { path: '/api/memory', router: memoryRoutes, baseMessage: 'API Mémoire Immunitaire' },
  { path: '/api/inventory', router: inventoryRoutes, baseMessage: 'API Inventaire' },
  { path: '/api/progression', router: progressionRoutes, baseMessage: 'API Progression' },
  { path: '/api/achievement', router: achievementRoutes, baseMessage: 'API Réalisations' },
  { path: '/api/threat-test', router: threatScannerRoutes, baseMessage: 'API Test de Menaces Scanner' },
  { path: '/api/leaderboard', router: leaderboardRoutes, baseMessage: 'API Classement' },
  { path: '/api/multiplayer', router: multiplayerRoutes, baseMessage: 'API Multijoueur' },
  { path: '/api/sync', router: syncRoutes, baseMessage: 'API Synchronisation' },
];

routes.forEach(({ path, router, baseMessage }) => {
  router.get('/', (req, res) => {
    res.status(200).json({
      message: baseMessage,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  });
  app.use(path, router);
  info(`Route montée : ${path}`);
});

// --- Route de santé ---
app.get('/api/health', async (req, res) => {
  try {
    await db.collection('status').doc('health_check').get();
    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    error('Échec de la vérification de santé', { error: err.message });
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// --- Route de base API ---
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Bienvenue sur l\'API Immuno-Warriors !',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: routes.map(({ path }) => path),
  });
});

// --- Middleware de gestion des erreurs ---
app.use(errorMiddleware);

// --- Gestion des arrêts gracieux ---
let isShuttingDown = false;

process.on('SIGTERM', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  info('Signal SIGTERM reçu. Arrêt du serveur...');
  try {
    await db.collection('status').doc('api_status').update({
      last_stopped: admin.firestore.FieldValue.serverTimestamp(),
      message: 'API arrêtée',
    });
    await updateApiUrlInFirestore(process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : `http://localhost:${PORT}`, 'stopped');
  } catch (err) {
    error('Erreur lors de l\'arrêt de Firestore', { error: err.message });
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  info('Signal SIGINT reçu. Arrêt du serveur...');
  try {
    await db.collection('status').doc('api_status').update({
      last_stopped: admin.firestore.FieldValue.serverTimestamp(),
      message: 'API arrêtée',
    });
    await updateApiUrlInFirestore(process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : `http://localhost:${PORT}`, 'stopped');
  } catch (err) {
    error('Erreur lors de l\'arrêt de Firestore', { error: err.message });
  }
  process.exit(0);
});

// --- Gestion des erreurs non gérées ---
process.on('unhandledRejection', (reason, promise) => {
  error('Promesse non gérée rejetée', {
    reason: reason.message || reason,
    stack: reason.stack,
    promise,
  });
});

process.on('uncaughtException', (err) => {
  error('Exception non gérée', {
    error: err.message,
    stack: err.stack,
  });
  if (!isShuttingDown) {
    process.exit(1);
  }
});

// --- Démarrage du serveur ---
async function startServer() {
  try {
    info('Démarrage du serveur...');
    await healthCheck();
    const interfaces = os.networkInterfaces();
    const ip = Object.values(interfaces)
      .flat()
      .find(i => i.family === 'IPv4' && !i.internal)?.address || '0.0.0.0';
    const localUrl = process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : `http://${ip}:${PORT}`;

    const server = app.listen(PORT, '0.0.0.0', async () => {
      info(`Serveur démarré sur le port ${PORT}`, {
        localUrl: `${localUrl}/api`,
        environment: process.env.NODE_ENV || 'development',
      });

      await updateApiUrlInFirestore(localUrl, 'active');

      // Mise à jour du statut Firestore
      await db.collection('status').doc('api_status').set({
        last_started: admin.firestore.FieldValue.serverTimestamp(),
        message: 'API démarrée',
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        ip,
        localUrl,
      }, { merge: true });
    });

    process.on('SIGTERM', () => server.close());
    process.on('SIGINT', () => server.close());
  } catch (err) {
    error('Échec du démarrage du serveur', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

startServer();

module.exports = app;