const admin = require('firebase-admin');
const config = require('../config');
const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errorUtils');

class FirebaseService {
  constructor() {
    this.db = null;
    this.auth = null;
    this.admin = admin;
    this.initializeFirebase();
  }

  initializeFirebase() {
    try {
      // Utilisation des credentials directes depuis config.firebase
      logger.info('Firebase: Utilisation des credentials directes');
      const requiredFields = ['projectId', 'clientEmail', 'privateKey', 'databaseURL'];
      const missingFields = requiredFields.filter(field => !config.firebase[field]);
      if (missingFields.length > 0) {
        throw new AppError(
          500,
          `Configuration credentials Firebase incomplète : ${missingFields.join(', ')} manquant(s)`,
          'Missing Firebase configuration fields'
        );
      }

      const serviceAccount = {
        project_id: config.firebase.projectId,
        client_email: config.firebase.clientEmail,
        private_key: config.firebase.privateKey,
      };

      logger.info('Firebase: Credentials directes validées', { projectId: serviceAccount.project_id });

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: config.firebase.databaseURL,
        });
        logger.info('Firebase Admin SDK initialisé avec succès', {
          projectId: serviceAccount.project_id,
          environment: config.nodeEnv,
        });
      }

      this.db = admin.firestore();
      this.auth = admin.auth();
      this.db.settings({ ignoreUndefinedProperties: true });

      // Vérification de la connexion
      this.retryConnect(3, 5000);
    } catch (error) {
      logger.error('Échec de l\'initialisation de Firebase', {
        error: error.message,
        stack: error.stack,
      });
      throw new AppError(500, 'Échec de l\'initialisation de Firebase', error.message);
    }
  }

  async retryConnect(maxRetries, delayMs) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.verifyConnection();
        logger.info('Connexion Firebase vérifiée avec succès');
        return true;
      } catch (error) {
        lastError = error;
        logger.warn(`Tentative de connexion Firestore échouée (${attempt}/${maxRetries})`, {
          error: error.message,
        });
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    logger.error('Échec définitif de la connexion à Firestore après plusieurs tentatives');
    throw lastError;
  }

  async verifyConnection() {
    try {
      const testDoc = this.db.collection('status').doc('connection_test');
      await testDoc.set({
        lastChecked: admin.firestore.FieldValue.serverTimestamp(),
        status: 'connected',
      });
      logger.info('Connexion Firestore vérifiée');
    } catch (error) {
      logger.error('Échec de la vérification de la connexion Firestore', {
        error: error.message,
        stack: error.stack,
      });
      throw new AppError(500, 'Impossible de se connecter à Firestore', error.message);
    }
  }

  async listCollections() {
    try {
      const collections = await this.db.listCollections();
      return collections.map(col => col.id);
    } catch (error) {
      logger.error('Erreur lors de la récupération des collections Firestore', {
        error: error.message,
      });
      throw new AppError(500, 'Erreur lors de la récupération des collections', error.message);
    }
  }

  async shutdown() {
    try {
      if (admin.apps.length) {
        await admin.app().delete();
        logger.info('Application Firebase arrêtée');
      }
    } catch (error) {
      logger.error('Erreur lors de l\'arrêt de Firebase', {
        error: error.message,
      });
    }
  }
}

const firebaseService = new FirebaseService();

module.exports = {
  db: firebaseService.db,
  auth: firebaseService.auth,
  admin: firebaseService.admin,
  verifyConnection: firebaseService.verifyConnection.bind(firebaseService),
  listCollections: firebaseService.listCollections.bind(firebaseService),
  shutdown: firebaseService.shutdown.bind(firebaseService),
};