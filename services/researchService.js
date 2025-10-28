const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const ResearchRepository = require('../repositories/researchRepository');
const UserRepository = require('../repositories/userRepository');

class ResearchService {
  async getResearchTree() {
    try {
      const researchItems = await ResearchRepository.getAllResearchItems();
      logger.info('Arbre de recherche récupéré');
      return researchItems;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'arbre de recherche', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de l\'arbre de recherche');
    }
  }

  async getResearchProgress(userId) {
    try {
      const progress = await ResearchRepository.getResearchProgression(userId);
      logger.info(`Progression de recherche récupérée pour l'utilisateur ${userId}`);
      return progress;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la progression de recherche', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de la progression');
    }
  }

  async unlockResearch(userId, researchId) {
    try {
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const research = await ResearchRepository.getResearchItem(researchId);
      if (!research) throw new NotFoundError('Recherche non trouvée');

      if (research.isUnlocked) throw new AppError(400, 'Recherche déjà déverrouillée');

      const cost = research.cost || { credits: 100 };
      const resources = await UserRepository.getUserResources(userId);
      if (resources.credits < cost.credits) throw new AppError(400, 'Ressources insuffisantes');

      await ResearchRepository.unlockResearchItem(researchId);
      await UserRepository.updateUserResources(userId, {
        credits: resources.credits - cost.credits
      });
      logger.info(`Recherche ${researchId} déverrouillée pour l'utilisateur ${userId}`);
    } catch (error) {
      logger.error('Erreur lors du déverrouillage de la recherche', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors du déverrouillage de la recherche');
    }
  }

  async updateResearchProgress(userId, researchId, progress) {
    try {
      await ResearchRepository.saveResearchProgression(userId, researchId, progress);
      logger.info(`Progression de recherche ${researchId} mise à jour pour l'utilisateur ${userId}`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la progression de recherche', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour de la progression');
    }
  }
}

module.exports = new ResearchService();
