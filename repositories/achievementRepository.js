const { v4: uuidv4 } = require('uuid');
const { db } = require('../services/firebaseService');
const { validateAchievement, fromFirestore, toFirestore } = require('../models/achievementModel');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');

/**
 * Repository pour gérer les accès aux données des succès dans Firestore.
 */
class AchievementRepository {
  constructor() {
    this.collection = db.collection('achievements');
    this.cacheCollection = db.collection('achievementCache');
  }

  /**
   * Récupère un succès par son ID.
   * @param {string} id - ID du succès.
   * @returns {Promise<Object|null>} - Données du succès ou null si non trouvé.
   */
  async getAchievement(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) return null;
      const achievement = fromFirestore(doc.data());
      if (achievement.deleted) return null;
      return achievement;
    } catch (error) {
      logger.error('Erreur lors de la récupération du succès', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération du succès');
    }
  }

  /**
   * Récupère tous les succès non supprimés.
   * @returns {Promise<Array>} - Liste des succès.
   */
  async getAllAchievements() {
    try {
      const snapshot = await this.collection.get();
      return snapshot.docs
        .map(doc => fromFirestore(doc.data()))
        .filter(achievement => !achievement.deleted);
    } catch (error) {
      logger.error('Erreur lors de la récupération des succès', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des succès');
    }
  }

  /**
   * Récupère les succès par catégorie.
   * @param {string} category - Catégorie (beginner, intermediate, advanced).
   * @returns {Promise<Array>} - Liste des succès de la catégorie.
   */
  async getAchievementsByCategory(category) {
    try {
      const snapshot = await this.collection.where('category', '==', category).get();
      return snapshot.docs
        .map(doc => fromFirestore(doc.data()))
        .filter(achievement => !achievement.deleted);
    } catch (error) {
      logger.error('Erreur lors de la récupération des succès par catégorie', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des succès par catégorie');
    }
  }

  /**
   * Met à jour ou crée un succès.
   * @param {Object} achievement - Données du succès.
   * @returns {Promise<string>} - ID du succès.
   */
  async updateAchievement(achievement) {
    const validation = validateAchievement(achievement);
    if (validation.error) {
      throw new AppError(400, 'Données de succès invalides', validation.error.details);
    }
    const achievementId = achievement.id || uuidv4();
    try {
      const data = toFirestore({ ...achievement, id: achievementId, updatedAt: formatTimestamp() });
      await this.collection.doc(achievementId).set(data, { merge: true });
      logger.info(`Succès ${achievementId} mis à jour`);
      return achievementId;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du succès', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour du succès');
    }
  }

  /**
   * Met en cache un succès.
   * @param {string} achievementId - ID du succès.
   * @param {Object|null} achievementData - Données du succès ou null pour vider le cache.
   */
  async cacheAchievement(achievementId, achievementData) {
    try {
      if (achievementData) {
        await this.cacheCollection.doc(achievementId).set({
          ...toFirestore(achievementData),
          cachedAt: formatTimestamp(),
        });
        logger.info(`Succès ${achievementId} mis en cache`);
      } else {
        await this.cacheCollection.doc(achievementId).delete();
        logger.info(`Cache du succès ${achievementId} supprimé`);
      }
    } catch (error) {
      logger.error('Erreur lors de la mise en cache du succès', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise en cache du succès');
    }
  }

  /**
   * Récupère un succès du cache.
   * @param {string} achievementId - ID du succès.
   * @returns {Promise<Object|null>} - Données du succès ou null si non trouvé.
   */
  async getCachedAchievement(achievementId) {
    try {
      const doc = await this.cacheCollection.doc(achievementId).get();
      if (!doc.exists) return null;
      const achievement = fromFirestore(doc.data());
      if (achievement.deleted) return null;
      return achievement;
    } catch (error) {
      logger.error('Erreur lors de la récupération du succès en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération du succès en cache');
    }
  }

  /**
   * Vide tout le cache des succès.
   */
  async clearCachedAchievements() {
    try {
      const snapshot = await this.cacheCollection.get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      logger.info('Tous les succès en cache ont été supprimés');
    } catch (error) {
      logger.error('Erreur lors de la suppression des succès en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression des succès en cache');
    }
  }
}

module.exports = new AchievementRepository();
