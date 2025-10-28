const admin = require('firebase-admin');
const path = require('path');
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
      let serviceAccount;

      if (config.firebaseServiceAccountPath) {
        const serviceAccountPath = path.resolve(__dirname, '..', config.firebaseServiceAccountPath);
        logger.info('Firebase: Tentative de chargement du fichier de compte de service', { path: serviceAccountPath });

        try {
          serviceAccount = require(serviceAccountPath);
          const requiredFields = ['project_id', 'client_email', 'private_key'];
          const missingFields = requiredFields.filter(field => !serviceAccount[field]);
          if (missingFields.length > 0) {
            throw new Error(`Fichier de compte de service invalide : ${missingFields.join(', ')} manquant(s)`);
          }
          logger.info('Firebase: Fichier de compte de service validé', { projectId: serviceAccount.project_id });
        } catch (error) {
          throw new AppError(
            500,
            `Impossible de charger le fichier de compte de service à ${serviceAccountPath}`,
            error.message
          );
        }
      } else {
        logger.info('Firebase: Utilisation des credentials directes');
        const requiredFields = ['projectId', 'clientEmail', 'privateKey'];
        const missingFields = requiredFields.filter(field => !config.firebase[field]);
        if (missingFields.length > 0) {
          throw new AppError(
            500,
            `Configuration credentials directes Firebase incomplète : ${missingFields.join(', ')} manquant(s)`,
            'Missing Firebase configuration fields'
          );
        }

        serviceAccount = {
          project_id: config.firebase.projectId,
          client_email: config.firebase.clientEmail,
          private_key: config.firebase.privateKey,
        };
        logger.info('Firebase: Credentials directes validées', { projectId: serviceAccount.project_id });
      }

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: config.firebase.databaseURL,
        });
        logger.info('Firebase Admin SDK initialisé avec succès', {
          projectId: serviceAccount.project_id || config.firebase.projectId,
          environment: config.nodeEnv,
        });
      }

      this.db = admin.firestore();
      this.auth = admin.auth();
      this.db.settings({ ignoreUndefinedProperties: true });

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
    throw lastError;
  }

  async verifyConnection() {
    try {
      const credential = this.admin.app().options.credential;
      if (credential && typeof credential.getAccessToken === 'function') {
        try {
          const token = await credential.getAccessToken();
          logger.info('Firebase: Jeton d\'accès obtenu', {
            expiresIn: token.expires_in || 'indéfini',
            issuedAt: token.issued_at ? new Date(token.issued_at * 1000).toISOString() : 'non disponible',
            tokenPreview: token.access_token ? `${token.access_token.slice(0, 10)}...` : 'indéfini',
          });
        } catch (tokenError) {
          logger.warn('Échec de l\'obtention du jeton d\'accès, continuation sans jeton', {
            error: tokenError.message,
          });
        }
      } else {
        logger.info('Firebase: Aucune vérification de jeton effectuée, credential.getAccessToken non disponible');
      }

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