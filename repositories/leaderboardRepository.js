const { db } = require('../services/firebaseService');
const { validateLeaderboardEntry, fromFirestore, toFirestore } = require('../models/leaderboardModel');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');
const UserRepository = require('../repositories/userRepository');

class LeaderboardRepository {
  constructor() {
    this.collection = db.collection('leaderboards');
  }

  async updateScore(userId, category, score) {
    try {
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const entry = {
        userId,
        username: user.username || 'Anonyme',
        score,
        rank: 1, // Will be updated post-save
        updatedAt: formatTimestamp(),
        category,
        deleted: false,
      };

      const validation = validateLeaderboardEntry(entry);
      if (validation.error) {
        throw new AppError(400, 'Données de classement invalides', validation.error.details);
      }

      await this.collection.doc(`${category}-${userId}`).set(toFirestore(entry));
      await this._updateRanks(category);
      logger.info(`Score ${score} mis à jour pour l'utilisateur ${userId} dans ${category}`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du score', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du score');
    }
  }

  async getLeaderboard(category, page = 1, limit = 10) {
    try {
      if (!category) throw new AppError(400, 'Catégorie invalide');
      const snapshot = await this.collection
        .where('category', '==', category)
        .where('deleted', '==', false)
        .orderBy('score', 'desc')
        .orderBy('updatedAt', 'desc')
        .offset((page - 1) * limit)
        .limit(limit)
        .get();
      const entries = snapshot.docs.map(doc => fromFirestore(doc.data()));
      logger.info(`Classement récupéré pour la catégorie ${category}, page ${page}, limite ${limit}`);
      return entries;
    } catch (error) {
      logger.error('Erreur lors de la récupération du classement', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du classement');
    }
  }

  async getUserRank(userId, category) {
    try {
      if (!userId || !category) throw new AppError(400, 'Utilisateur ou catégorie invalide');
      const snapshot = await this.collection
        .where('category', '==', category)
        .where('deleted', '==', false)
        .orderBy('score', 'desc')
        .orderBy('updatedAt', 'desc')
        .get();
      const scores = snapshot.docs.map(doc => doc.data());
      const userIndex = scores.findIndex(score => score.userId === userId);
      if (userIndex === -1) throw new NotFoundError('Rang non trouvé pour l\'utilisateur');
      const rank = userIndex + 1;
      logger.info(`Rang ${rank} récupéré pour l'utilisateur ${userId} dans ${category}`);
      return { rank, score: scores[userIndex].score };
    } catch (error) {
      logger.error('Erreur lors de la récupération du rang', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du rang');
    }
  }

  async _updateRanks(category) {
    try {
      const snapshot = await this.collection
        .where('category', '==', category)
        .where('deleted', '==', false)
        .orderBy('score', 'desc')
        .orderBy('updatedAt', 'desc')
        .get();
      const batch = db.batch();
      snapshot.docs.forEach((doc, index) => {
        batch.update(doc.ref, { rank: index + 1 });
      });
      await batch.commit();
      logger.info(`Rangs mis à jour pour la catégorie ${category}`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des rangs', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour des rangs');
    }
  }
}

module.exports = new LeaderboardRepository();
