const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const LeaderboardRepository = require('../repositories/leaderboardRepository');
const UserRepository = require('../repositories/userRepository');

class LeaderboardService {
  async updateScore(userId, category, score) {
    try {
      if (!userId || !category || score < 0) throw new AppError(400, 'Données invalides');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      await LeaderboardRepository.updateScore(userId, category, score);
      logger.info(`Score ${score} mis à jour pour l'utilisateur ${userId} dans ${category}`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du score', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du score');
    }
  }

  async getLeaderboard(category, page = 1, limit = 10) {
    try {
      if (!category) throw new AppError(400, 'Catégorie invalide');
      if (page < 1 || limit < 1) throw new AppError(400, 'Paramètres de pagination invalides');
      const leaderboard = await LeaderboardRepository.getLeaderboard(category, page, limit);
      logger.info(`Classement récupéré pour la catégorie ${category}, page ${page}, limite ${limit}`);
      return leaderboard;
    } catch (error) {
      logger.error('Erreur lors de la récupération du classement', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du classement');
    }
  }

  async getUserRank(userId, category) {
    try {
      if (!userId || !category) throw new AppError(400, 'Utilisateur ou catégorie invalide');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const rankInfo = await LeaderboardRepository.getUserRank(userId, category);
      logger.info(`Rang ${rankInfo.rank} récupéré pour l'utilisateur ${userId} dans ${category}`);
      return rankInfo;
    } catch (error) {
      logger.error('Erreur lors de la récupération du rang', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du rang');
    }
  }
}

module.exports = new LeaderboardService();
