const { db } = require('../services/firebaseService');
const { v4: uuidv4 } = require('uuid');
const { validateResearch, fromFirestore, toFirestore } = require('../models/researchModel');
const { AppError } = require('../utils/errorUtils');
const logger = require('../utils/logger');
const { formatTimestamp } = require('../utils/syncUtils');

/**
 * Repository pour gérer les recherches dans le domaine de la recherche dans Firestore.
 */
class ResearchRepository {
  constructor() {
    this.collection = db.collection('researches');
    this.cacheCollection = db.collection('researchCache');
  }

  async getAllResearchItems() {
    try {
      const snapshot = await this.collection.get();
      return snapshot.docs.map(doc => fromFirestore(doc.data()));
    } catch (error) {
      logger.error('Erreur dans la récupération des recherches', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des recherches');
    }
  }

  async getResearchItem(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) return null;
      return fromFirestore(doc.data());
    } catch (error) {
      logger.error('Erreur dans la récupération de la recherche', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de la recherche');
    }
  }

  async unlockResearchItem(id) {
    try {
      await this.collection.doc(id).update({ isUnlocked: true });
      logger.info(`Recherche ${id} déverrouillée`);
    } catch (error) {
      logger.error('Erreur dans le déverrouillage de la recherche', { error });
      throw new AppError(500, 'Erreur serveur lors du déverrouillage de la recherche');
    }
  }

  async createResearchItem(researchItemData) {
    const validation = validateResearch(researchItemData);
    if (validation.error) {
      throw new AppError(400, 'Données de recherche invalides', validation.error.details);
    }
    const researchId = researchItemData.id || uuidv4();
    try {
      await this.collection.doc(researchId).set(toFirestore({ ...researchItemData, id: researchId }));
      logger.info(`Données de recherche ${researchId} créées`);
      return researchId;
    } catch (error) {
      logger.error('Erreur dans la création de la recherche', { error });
      throw new AppError(500, 'Erreur serveur lors de la création de la recherche');
    }
  }

  async updateResearchProgress(userId, researchId, progress) {
    try {
      await this.collection.doc(researchId).update({
        progression: { progress, completed: progress >= 100 },
        updatedAt: formatTimestamp(),
      });
      logger.info(`Progression de la recherche ${researchId} mise à jour pour l'utilisateur ${userId}`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la progression de la recherche', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour de la progression de la recherche');
    }
  }

  async getResearchProgression(userId) {
    try {
      const snapshot = await this.collection.where('userId', '==', userId).get();
      const progress = {};
      snapshot.forEach(doc => {
        const data = fromFirestore(doc.data());
        progress[data.id] = data.progression || { progress: 0, completed: false };
      });
      logger.info(`Progression de la recherche récupérée pour l'utilisateur ${userId}`);
      return progress;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la progression de la recherche', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de la progression de la recherche');
    }
  }

  async cacheResearchItem(researchId, researchData) {
    try {
      await this.cacheCollection.doc(researchId).set({
        ...toFirestore(researchData),
        cachedAt: formatTimestamp(),
      });
      logger.info(`Recherche ${researchId} mise en cache`);
    } catch (error) {
      logger.error('Erreur lors de la mise en cache de la recherche', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise en cache de la recherche');
    }
  }

  /**
   * Récupère un élément de recherche en cache.
   * @param {string} researchId - ID de la recherche.
   * @returns {Promise<Object|null>} Recherche ou null.
   */
  async getCachedResearchItem(researchId) {
    try {
      const doc = await this.cacheCollection.doc(researchId).get();
      if (!doc.exists) return null;
      return fromFirestore(doc.data());
    } catch (error) {
      logger.error('Erreur lors de la récupération de la recherche en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de la recherche en cache');
    }
  }
}

module.exports = new ResearchRepository();
