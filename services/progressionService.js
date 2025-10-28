const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { validateProgression } = require('../models/progressionModel');
const ProgressionRepository = require('../repositories/progressionRepository');
const UserRepository = require('../repositories/userRepository');

class ProgressionService {
  /**
   * Récupère la progression d'un utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<Object>} - Progression de l'utilisateur (niveau, XP, missions).
   */
  async getProgression(userId) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      const progression = await ProgressionRepository.getProgression(userId);
      if (!progression) throw new NotFoundError('Progression non trouvée');
      const validated = validateProgression(progression);
      if (validated.error) throw new AppError(500, 'Données de progression corrompues');
      logger.info(`Progression récupérée pour l'utilisateur ${userId}`);
      return progression;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la progression', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de la progression');
    }
  }

  /**
   * Ajoute de l'expérience (XP) à un utilisateur et gère les montées de niveau.
   * @param {string} userId - ID de l'utilisateur.
   * @param {number} xp - Quantité d'XP à ajouter.
   * @returns {Promise<Object>} - Progression mise à jour.
   */
  async addXP(userId, xp) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      if (!Number.isInteger(xp) || xp <= 0) throw new AppError(400, 'XP doit être un entier positif');

      let progression = await ProgressionRepository.getProgression(userId);
      if (!progression) throw new NotFoundError('Progression non trouvée');

      const newXP = progression.xp + xp;
      const xpForNextLevel = this._calculateXPForLevel(progression.level + 1);
      let newLevel = progression.level;
      let newRank = progression.rank;

      if (newXP >= xpForNextLevel) {
        newLevel += 1;
        newRank = this._calculateRank(newLevel);
      }

      const updatedProgression = {
        ...progression,
        level: newLevel,
        xp: newXP,
        rank: newRank,
        updatedAt: new Date().toISOString()
      };

      const { error } = validateProgression(updatedProgression);
      if (error) throw new AppError(400, `Données de progression invalides: ${error.message}`);

      await ProgressionRepository.updateProgression(userId, updatedProgression);
      await UserRepository.cacheCurrentUser(userId, await UserRepository.getCurrentUser(userId));
      logger.info(`Ajout de ${xp} XP pour l'utilisateur ${userId}, nouveau niveau: ${newLevel}`);
      return updatedProgression;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout d\'XP', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'ajout d\'XP');
    }
  }

  /**
   * Complète une mission pour un utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} missionId - ID de la mission.
   * @returns {Promise<Object>} - Progression mise à jour.
   */
  async completeMission(userId, missionId) {
    try {
      if (!userId || !missionId) throw new AppError(400, 'ID d\'utilisateur ou de mission invalide');
      let progression = await ProgressionRepository.getProgression(userId);
      if (!progression) throw new NotFoundError('Progression non trouvée');

      const mission = progression.missions?.find(m => m.id === missionId);
      if (!mission) throw new NotFoundError('Mission non trouvée');
      if (mission.completed) throw new AppError(400, 'Mission déjà complétée');

      const updatedMissions = progression.missions.map(m =>
        m.id === missionId ? { ...m, completed: true } : m
      );
      const updatedProgression = {
        ...progression,
        missions: updatedMissions,
        updatedAt: new Date().toISOString()
      };

      const { error } = validateProgression(updatedProgression);
      if (error) throw new AppError(400, `Données de mission invalides: ${error.message}`);

      await ProgressionRepository.updateProgression(userId, updatedProgression);
      await UserRepository.cacheCurrentUser(userId, await UserRepository.getCurrentUser(userId));
      logger.info(`Mission ${missionId} complétée pour l'utilisateur ${userId}`);
      return updatedProgression;
    } catch (error) {
      logger.error('Erreur lors de la complétion de la mission', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la complétion de la mission');
    }
  }

  /**
   * Calcule l'XP requis pour atteindre un niveau donné.
   * @param {number} level - Niveau cible.
   * @returns {number} - XP requis.
   */
  _calculateXPForLevel(level) {
    if (level < 1) return 0;
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  _calculateRank(level) {
    if (level >= 20) return 'gold';
    if (level >= 10) return 'silver';
    return 'bronze';
  }
}

module.exports = new ProgressionService();