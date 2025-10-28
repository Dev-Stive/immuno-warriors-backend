const { db } = require('../services/firebaseService');
const { v4: uuidv4 } = require('uuid');
const { validateMultiplayerSession, fromFirestore, toFirestore } = require('../models/multiplayerSessionModel');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');

class MultiplayerRepository {
  constructor() {
    this.collection = db.collection('multiplayerSessions');
    this.cacheCollection = db.collection('multiplayerCache');
  }

  async getMultiplayerSession(sessionId) {
    try {
      const doc = await this.collection.doc(sessionId).get();
      if (!doc.exists) return null;
      const session = fromFirestore(doc.data());
      if (session.deleted) return null;
      return session;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la session multijoueur', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de la session multijoueur');
    }
  }

  async createMultiplayerSession(session) {
    const validation = validateMultiplayerSession(session);
    if (validation.error) {
      throw new AppError(400, 'Données de session multijoueur invalides', validation.error.details);
    }
    const sessionId = session.sessionId || uuidv4();
    try {
      const data = toFirestore({
        ...session,
        sessionId,
        createdAt: formatTimestamp(),
        updatedAt: formatTimestamp(),
        deleted: false,
      });
      await this.collection.doc(sessionId).set(data);
      await this.cacheMultiplayerSession(sessionId, data);
      logger.info(`Session multijoueur ${sessionId} créée`);
      return sessionId;
    } catch (error) {
      logger.error('Erreur lors de la création de la session multijoueur', { error });
      throw new AppError(500, 'Erreur serveur lors de la création de la session multijoueur');
    }
  }

  async updateMultiplayerSession(sessionId, updates) {
    const validation = validateMultiplayerSession({ sessionId, ...updates });
    if (validation.error) {
      throw new AppError(400, 'Données de session multijoueur invalides', validation.error.details);
    }
    try {
      const data = toFirestore({
        ...updates,
        updatedAt: formatTimestamp(),
      });
      await this.collection.doc(sessionId).update(data);
      const updatedSession = await this.getMultiplayerSession(sessionId);
      await this.cacheMultiplayerSession(sessionId, updatedSession);
      logger.info(`Session multijoueur ${sessionId} mise à jour`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la session multijoueur', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour de la session multijoueur');
    }
  }

  async cacheMultiplayerSession(sessionId, sessionData) {
    try {
      if (sessionData) {
        await this.cacheCollection.doc(sessionId).set({
          ...toFirestore(sessionData),
          cachedAt: formatTimestamp(),
        });
        logger.info(`Session multijoueur ${sessionId} mise en cache`);
      } else {
        await this.cacheCollection.doc(sessionId).delete();
        logger.info(`Cache de la session multijoueur ${sessionId} supprimé`);
      }
    } catch (error) {
      logger.error('Erreur lors de la mise en cache de la session multijoueur', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise en cache de la session multijoueur');
    }
  }

  async getCachedMultiplayerSession(sessionId) {
    try {
      const doc = await this.cacheCollection.doc(sessionId).get();
      if (!doc.exists) return null;
      const session = fromFirestore(doc.data());
      if (session.deleted) return null;
      return session;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la session en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de la session en cache');
    }
  }

  async clearCachedMultiplayerSessions() {
    try {
      const snapshot = await this.cacheCollection.get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      logger.info('Toutes les sessions multijoueurs en cache ont été supprimées');
    } catch (error) {
      logger.error('Erreur lors de la suppression des sessions en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression des sessions en cache');
    }
  }
}

module.exports = new MultiplayerRepository();
