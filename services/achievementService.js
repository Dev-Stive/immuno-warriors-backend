const { v4: uuidv4 } = require('uuid');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');
const UserService = require('./userService');
const NotificationService = require('./notificationService');
const AchievementRepository = require('../repositories/achievementRepository');

/**
 * Service pour gérer les succès dans le jeu.
 */
class AchievementService {
  /**
   * Crée un nouveau succès.
   * @param {Object} achievementData - Données du succès (name, description, criteria, etc.).
   * @returns {Promise<Object>} - Succès créé.
   */
  async createAchievement(achievementData) {
    try {
      if (!achievementData || typeof achievementData !== 'object') {
        throw new AppError(400, 'Données de succès invalides');
      }
      const achievementId = uuidv4();
      const achievement = {
        id: achievementId,
        name: achievementData.name || `Succès ${achievementId.slice(0, 8)}`,
        description: achievementData.description || 'Aucune description',
        type: achievementData.type || 'progression',
        criteria: achievementData.criteria || {},
        reward: achievementData.reward || { credits: 0, xp: 0, items: [] },
        category: achievementData.category || 'beginner',
        isUnlocked: false,
        createdAt: formatTimestamp(),
        updatedAt: formatTimestamp(),
      };
      await AchievementRepository.updateAchievement(achievement);
      await AchievementRepository.cacheAchievement(achievementId, achievement);
      logger.info(`Succès ${achievementId} créé avec nom ${achievement.name}`);
      return achievement;
    } catch (error) {
      logger.error('Erreur lors de la création du succès', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création du succès');
    }
  }

  /**
   * Récupère un succès par son ID.
   * @param {string} achievementId - ID du succès.
   * @returns {Promise<Object>} - Succès récupéré.
   */
  async getAchievement(achievementId) {
    try {
      if (!achievementId || typeof achievementId !== 'string') {
        throw new AppError(400, 'ID de succès invalide');
      }
      const achievement = await AchievementRepository.getCachedAchievement(achievementId) ||
        await AchievementRepository.getAchievement(achievementId);
      if (!achievement) throw new NotFoundError('Succès non trouvé');
      logger.info(`Succès ${achievementId} récupéré`);
      return achievement;
    } catch (error) {
      logger.error('Erreur lors de la récupération du succès', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du succès');
    }
  }

  /**
   * Récupère tous les succès disponibles.
   * @returns {Promise<Array>} - Liste des succès.
   */
  async getAchievements() {
    try {
      const achievements = await AchievementRepository.getAllAchievements();
      logger.info(`Récupération de ${achievements.length} succès`);
      return achievements;
    } catch (error) {
      logger.error('Erreur lors de la récupération des succès', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des succès');
    }
  }

  /**
   * Récupère les succès d'un utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<Array>} - Liste des succès de l'utilisateur.
   */
  async getUserAchievements(userId) {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new AppError(400, 'ID d\'utilisateur invalide');
      }
      const userAchievements = await UserService.getUserAchievements(userId);
      const achievements = await Promise.all(
        userAchievements.map(async ({ achievementId, progress, unlockedAt }) => {
          const achievement = await this.getAchievement(achievementId);
          return {
            ...achievement,
            progress: progress || {},
            isUnlocked: !!unlockedAt,
            unlockedAt: unlockedAt || null,
          };
        })
      );
      logger.info(`Récupération de ${achievements.length} succès pour l'utilisateur ${userId}`);
      return achievements;
    } catch (error) {
      logger.error('Erreur lors de la récupération des succès de l\'utilisateur', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des succès de l\'utilisateur');
    }
  }

  /**
   * Récupère les succès par catégorie.
   * @param {string} category - Catégorie (beginner, intermediate, advanced).
   * @returns {Promise<Array>} - Liste des succès de la catégorie.
   */
  async getAchievementsByCategory(category) {
    try {
      if (!['beginner', 'intermediate', 'advanced'].includes(category)) {
        throw new AppError(400, 'Catégorie invalide');
      }
      const achievements = await AchievementRepository.getAchievementsByCategory(category);
      logger.info(`Récupération de ${achievements.length} succès pour la catégorie ${category}`);
      return achievements;
    } catch (error) {
      logger.error('Erreur lors de la récupération des succès par catégorie', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des succès par catégorie');
    }
  }

  /**
   * Met à jour un succès existant.
   * @param {string} achievementId - ID du succès.
   * @param {Object} updates - Données à mettre à jour (name, description, criteria, reward).
   * @returns {Promise<Object>} - Succès mis à jour.
   */
  async updateAchievement(achievementId, updates) {
    try {
      if (!achievementId || !updates || typeof updates !== 'object') {
        throw new AppError(400, 'Données de mise à jour invalides');
      }
      const existingAchievement = await this.getAchievement(achievementId);
      const updatedAchievement = {
        ...existingAchievement,
        name: updates.name || existingAchievement.name,
        description: updates.description || existingAchievement.description,
        type: updates.type || existingAchievement.type,
        criteria: updates.criteria || existingAchievement.criteria,
        reward: updates.reward || existingAchievement.reward,
        category: updates.category || existingAchievement.category,
        updatedAt: formatTimestamp(),
      };
      await AchievementRepository.updateAchievement(updatedAchievement);
      await AchievementRepository.cacheAchievement(achievementId, updatedAchievement);
      logger.info(`Succès ${achievementId} mis à jour`);
      return updatedAchievement;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du succès', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du succès');
    }
  }

  /**
   * Supprime un succès (marquage logique).
   * @param {string} achievementId - ID du succès.
   * @returns {Promise<void>}
   */
  async deleteAchievement(achievementId) {
    try {
      if (!achievementId) {
        throw new AppError(400, 'ID de succès invalide');
      }
      await this.getAchievement(achievementId);
      await AchievementRepository.updateAchievement({ id: achievementId, deleted: true });
      await AchievementRepository.cacheAchievement(achievementId, null);
      logger.info(`Succès ${achievementId} supprimé`);
    } catch (error) {
      logger.error('Erreur lors de la suppression du succès', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du succès');
    }
  }

  /**
   * Vide le cache des succès.
   * @returns {Promise<void>}
   */
  async clearCachedAchievements() {
    try {
      await AchievementRepository.clearCachedAchievements();
      logger.info('Cache des succès vidé');
    } catch (error) {
      logger.error('Erreur lors de la suppression du cache des succès', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du cache des succès');
    }
  }

  /**
   * Vérifie si un utilisateur a atteint les critères pour débloquer un succès.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} achievementId - ID du succès.
   * @param {Object} userStats - Statistiques de l'utilisateur (ex. xp, missionsCompleted).
   * @returns {Promise<boolean>} - True si les critères sont remplis.
   */
  async checkAchievementCriteria(userId, achievementId, userStats) {
    try {
      if (!userId || !achievementId || !userStats) {
        throw new AppError(400, 'Paramètres invalides');
      }
      const achievement = await this.getAchievement(achievementId);
      const criteria = achievement.criteria || {};
      let meetsCriteria = true;

      if (criteria.minXP && userStats.xp < criteria.minXP) meetsCriteria = false;
      if (criteria.missionsCompleted && userStats.missionsCompleted < criteria.missionsCompleted) meetsCriteria = false;
      if (criteria.combatsWon && userStats.combatsWon < criteria.combatsWon) meetsCriteria = false;

      logger.info(`Vérification des critères du succès ${achievementId} pour l'utilisateur ${userId}: ${meetsCriteria}`);
      return meetsCriteria;
    } catch (error) {
      logger.error('Erreur lors de la vérification des critères du succès', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la vérification des critères');
    }
  }

  /**
   * Débloque un succès pour un utilisateur et attribue les récompenses.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} achievementId - ID du succès.
   * @returns {Promise<Object>} - Récompenses attribuées.
   */
  async unlockAchievement(userId, achievementId) {
    try {
      if (!userId || !achievementId) {
        throw new AppError(400, 'ID utilisateur ou succès invalide');
      }
      const achievement = await this.getAchievement(achievementId);
      const userAchievements = await UserService.getUserAchievements(userId);
      const userAchievement = userAchievements.find(a => a.achievementId === achievementId);

      if (userAchievement && userAchievement.isUnlocked) {
        throw new AppError(400, 'Succès déjà déverrouillé');
      }

      const userProgression = await UserService.getUserProgression(userId);
      const userStats = {
        xp: userProgression.xp || 0,
        missionsCompleted: userProgression.missionsCompleted || 0,
        combatsWon: userProgression.combatsWon || 0,
      };

      const canUnlock = await this.checkAchievementCriteria(userId, achievementId, userStats);
      if (!canUnlock) throw new AppError(400, 'Critères du succès non remplis');

      const rewards = achievement.reward || { credits: 0, xp: 0, items: [] };
      if (rewards.credits) await UserService.addResources(userId, { credits: rewards.credits });
      if (rewards.xp) await UserService.addXP(userId, rewards.xp);
      for (const item of rewards.items) {
        await UserService.addInventoryItem(userId, item);
      }

      await UserService.updateUserAchievements(userId, [
        ...userAchievements,
        {
          achievementId,
          progress: userStats,
          isUnlocked: true,
          unlockedAt: formatTimestamp(),
        },
      ]);

      await this.notifyAchievementUnlocked(userId, achievementId);

      logger.info(`Succès ${achievementId} débloqué pour l'utilisateur ${userId}`);
      return rewards;
    } catch (error) {
      logger.error('Erreur lors du déblocage du succès', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors du déblocage du succès');
    }
  }

  /**
   * Met à jour la progression d'un succès pour un utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} achievementId - ID du succès.
   * @param {Object} progress - Progression à mettre à jour (ex. { combatsWon: 5 }).
   * @returns {Promise<void>}
   */
  async updateAchievementProgress(userId, achievementId, progress) {
    try {
      if (!userId || !achievementId || !progress || typeof progress !== 'object') {
        throw new AppError(400, 'Paramètres invalides');
      }
      const achievement = await this.getAchievement(achievementId);
      const userAchievements = await UserService.getUserAchievements(userId);
      let userAchievement = userAchievements.find(a => a.achievementId === achievementId);

      if (!userAchievement) {
        userAchievement = { achievementId, progress: {}, isUnlocked: false };
        userAchievements.push(userAchievement);
      }

      userAchievement.progress = { ...userAchievement.progress, ...progress };

      const userStats = {
        xp: userAchievement.progress.xp || 0,
        missionsCompleted: userAchievement.progress.missionsCompleted || 0,
        combatsWon: userAchievement.progress.combatsWon || 0,
      };

      if (!userAchievement.isUnlocked && await this.checkAchievementCriteria(userId, achievementId, userStats)) {
        await this.unlockAchievement(userId, achievementId);
      } else {
        await UserService.updateUserAchievements(userId, userAchievements);
      }

      logger.info(`Progression du succès ${achievementId} mise à jour pour l'utilisateur ${userId}`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la progression du succès', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour de la progression');
    }
  }

  /**
   * Permet à un utilisateur de réclamer les récompenses d'un succès déverrouillé.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} achievementId - ID du succès.
   * @returns {Promise<Object>} - Récompenses attribuées.
   */
  async claimReward(userId, achievementId) {
    try {
      if (!userId || !achievementId) {
        throw new AppError(400, 'ID utilisateur ou succès invalide');
      }
      const userAchievements = await UserService.getUserAchievements(userId);
      const userAchievement = userAchievements.find(a => a.achievementId === achievementId);

      if (!userAchievement || !userAchievement.isUnlocked) {
        throw new AppError(400, 'Succès non déverrouillé ou introuvable');
      }

      const achievement = await this.getAchievement(achievementId);
      const rewards = achievement.reward || { credits: 0, xp: 0, items: [] };

      if (userAchievement.rewardClaimed) {
        throw new AppError(400, 'Récompenses déjà réclamées');
      }

      if (rewards.credits) await UserService.addResources(userId, { credits: rewards.credits });
      if (rewards.xp) await UserService.addXP(userId, rewards.xp);
      for (const item of rewards.items) {
        await UserService.addInventoryItem(userId, item);
      }

      userAchievement.rewardClaimed = true;
      await UserService.updateUserAchievements(userId, userAchievements);

      logger.info(`Récompenses réclamées pour le succès ${achievementId} par l'utilisateur ${userId}`);
      return rewards;
    } catch (error) {
      logger.error('Erreur lors de la réclamation des récompenses', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la réclamation des récompenses');
    }
  }

  /**
   * Envoie une notification lorsqu'un succès est déverrouillé.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} achievementId - ID du succès.
   * @returns {Promise<void>}
   */
  async notifyAchievementUnlocked(userId, achievementId) {
    try {
      if (!userId || !achievementId) {
        throw new AppError(400, 'ID utilisateur ou succès invalide');
      }
      const achievement = await this.getAchievement(achievementId);
      const notification = {
        type: 'achievement_unlocked',
        message: `Vous avez déverrouillé le succès "${achievement.name}" !`,
        data: { achievementId },
      };
      await NotificationService.createNotification(userId, notification);
      logger.info(`Notification envoyée pour le succès ${achievementId} à l'utilisateur ${userId}`);
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de la notification de succès', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'envoi de la notification');
    }
  }
}

module.exports = new AchievementService();
