const { v4: uuidv4 } = require('uuid');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');
const { generateRandomStats } = require('../utils/randomUtils');
const PathogenRepository = require('../repositories/pathogenRepository');
const UserRepository = require('../repositories/userRepository');

class PathogenService {
  async createPathogen(userId, pathogenData) {
    try {
      if (!userId || !pathogenData) throw new AppError(400, 'Données invalides');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const pathogenId = uuidv4();
      const baseStats = { health: 100, attack: 20, resistance: 10 };
      const stats = generateRandomStats(baseStats, 0.2);
      const pathogen = {
        id: pathogenId,
        type: pathogenData.type || 'virus',
        name: pathogenData.name || `Pathogène ${pathogenId.slice(0, 6)}`,
        health: stats.health,
        attack: stats.attack,
        attackType: pathogenData.attackType || 'physical',
        resistanceType: pathogenData.resistanceType || 'physical',
        rarity: pathogenData.rarity || 'common',
        mutationRate: pathogenData.mutationRate || 0.1,
        abilities: pathogenData.abilities || [],
        createdAt: formatTimestamp(),
        updatedAt: formatTimestamp(),
        createdBy: userId,
      };
      await PathogenRepository.createPathogen(pathogen);
      await PathogenRepository.cachePathogen(pathogenId, pathogen);
      logger.info(`Pathogène ${pathogenId} créé par l'utilisateur ${userId}`);
      return pathogen;
    } catch (error) {
      logger.error('Erreur lors de la création du pathogène', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création du pathogène');
    }
  }

  async createBatchPathogens(userId, pathogensData) {
    try {
      if (!userId || !pathogensData || !pathogensData.length) throw new AppError(400, 'Données invalides');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const pathogens = pathogensData.map(data => {
        const pathogenId = uuidv4();
        const baseStats = { health: 100, attack: 20, resistance: 10 };
        const stats = generateRandomStats(baseStats, 0.2);
        return {
          id: pathogenId,
          type: data.type || 'virus',
          name: data.name || `Pathogène ${pathogenId.slice(0, 6)}`,
          health: stats.health,
          attack: stats.attack,
          attackType: data.attackType || 'physical',
          resistanceType: data.resistanceType || 'physical',
          rarity: data.rarity || 'common',
          mutationRate: data.mutationRate || 0.1,
          abilities: data.abilities || [],
          createdAt: formatTimestamp(),
          updatedAt: formatTimestamp(),
          createdBy: userId,
        };
      });
      const ids = await PathogenRepository.createBatchPathogens(pathogens);
      for (const [index, id] of ids.entries()) {
        await PathogenRepository.cachePathogen(id, pathogens[index]);
      }
      logger.info(`${ids.length} pathogènes créés en lot par l'utilisateur ${userId}`);
      return ids;
    } catch (error) {
      logger.error('Erreur lors de la création du lot de pathogènes', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création du lot');
    }
  }

  async getAllPathogens(page = 1, limit = 10) {
    try {
      const pathogens = await PathogenRepository.getAllPathogens(page, limit);
      logger.info(`Récupération de ${pathogens.length} pathogènes`);
      return pathogens;
    } catch (error) {
      logger.error('Erreur lors de la récupération de tous les pathogènes', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération');
    }
  }

  async getPathogenById(pathogenId) {
    try {
      if (!pathogenId) throw new AppError(400, 'ID de pathogène invalide');
      const pathogen = await PathogenRepository.getCachedPathogen(pathogenId) ||
        await PathogenRepository.getPathogenById(pathogenId);
      if (!pathogen) throw new NotFoundError('Pathogène non trouvé');
      logger.info(`Pathogène ${pathogenId} récupéré`);
      return pathogen;
    } catch (error) {
      logger.error('Erreur lors de la récupération du pathogène', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération');
    }
  }

  async getPathogensByType(type, page = 1, limit = 10) {
    try {
      if (!type) throw new AppError(400, 'Type de pathogène obligatoire');
      const pathogens = await PathogenRepository.getPathogensByType(type, page, limit);
      logger.info(`Récup de ${pathogens.length} pathogènes de type ${type}`);
      return pathogens;
    } catch (error) {
      logger.error('Erreur lors de la récupération des pathogènes par type', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération');
    }
  }

  async getPathogensByRarity(rarity, page = 1, limit = 6) {
    try {
      if (!rarity) throw new AppError(400, 'Rareté obligatoire');
      const pathogens = await PathogenRepository.getPathogensByRarity(rarity, page, limit);
      logger.info(`Récupération de ${pathogens.length} pathogènes de rareté ${rarity}`);
      return pathogens;
    } catch (error) {
      logger.error('Erreur lors de la récupération des pathogènes par rareté', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération');
    }
  }

  async updatePathogenStats(userId, pathogenId, statsData) {
    try {
      if (!userId || !pathogenId || !statsData) throw new AppError(400, 'Données invalides');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');
      const pathogen = await PathogenRepository.getPathogenById(pathogenId);
      if (!pathogen) throw new NotFoundError('Pathogène non trouvé');

      const updates = {
        health: statsData.health || pathogen.health,
        attack: statsData.attack || pathogen.attack,
        abilities: statsData.abilities || pathogen.abilities,
        updatedAt: formatTimestamp(),
      };
      await PathogenRepository.updatePathogen(pathogenId, updates);
      const updatedPathogen = await PathogenRepository.getPathogenById(pathogenId);
      await PathogenRepository.cachePathogen(pathogenId, updatedPathogen);
      logger.info(`Statistiques du pathogène ${pathogenId} mises à jour par l'utilisateur ${userId}`);
      return updatedPathogen;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des statistiques du pathogène', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour');
    }
  }

  async deletePathogen(userId, pathogenId) {
    try {
      if (!userId || !pathogenId) throw new AppError(400, 'Données invalides');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');
      const pathogen = await PathogenRepository.getPathogenById(pathogenId);
      if (!pathogen) throw new NotFoundError('Pathogène non trouvé');

      await PathogenRepository.deletePathogen(pathogenId);
      logger.info(`Pathogène ${pathogenId} supprimé par l'utilisateur ${userId}`);
    } catch (error) {
      logger.error('Erreur lors de la suppression du pathogène', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression');
    }
  }
}

module.exports = new PathogenService();
