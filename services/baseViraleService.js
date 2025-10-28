const { v4: uuidv4 } = require('uuid');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const logger = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');
const BaseViraleRepository = require('../repositories/baseViraleRepository');
const PathogenRepository = require('../repositories/pathogenRepository');

class BaseViraleService {
  async createBase(userId, baseData) {
    try {
      if (!userId || !baseData || typeof baseData !== 'object') {
        throw new AppError(400, 'Données de base virale invalides');
      }
      const baseId = uuidv4();
      const base = {
        id: baseId,
        playerId: userId,
        name: baseData.name,
        level: 1,
        pathogens: [],
        defenses: baseData.defenses || [],
        createdAt: formatTimestamp(),
        updatedAt: formatTimestamp(),
      };
      await BaseViraleRepository.createBaseVirale(base);
      await BaseViraleRepository.cacheBaseVirale(baseId, base);
      logger.info(`Base virale ${baseId} créée pour l'utilisateur ${userId}`);
      return base;
    } catch (error) {
      logger.error('Erreur lors de la création de la base virale', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création de la base');
    }
  }

  async getBase(baseId) {
    try {
      if (!baseId || typeof baseId !== 'string') {
        throw new AppError(400, 'ID de base virale invalide');
      }
      const base = await BaseViraleRepository.getCachedBaseVirale(baseId) ||
        await BaseViraleRepository.getBaseViraleById(baseId);
      if (!base) throw new NotFoundError('Base virale non trouvée');
      logger.info(`Base virale ${baseId} récupérée`);
      return base;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la base virale', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de la base');
    }
  }

  async getPlayerBases(userId) {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new AppError(400, 'ID d\'utilisateur invalide');
      }
      const bases = await BaseViraleRepository.getBaseViralesForPlayer(userId);
      logger.info(`Récupération de ${bases.length} bases virales pour l'utilisateur ${userId}`);
      return bases;
    } catch (error) {
      logger.error('Erreur lors de la récupération des bases du joueur', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des bases');
    }
  }

  async getAllBases() {
    try {
      const bases = await BaseViraleRepository.getAllBases();
      logger.info(`Récupération de ${bases.length} bases virales`);
      return bases;
    } catch (error) {
      logger.error('Erreur lors de la récupération de toutes les bases', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de toutes les bases');
    }
  }

  async updateBase(baseId, updates) {
    try {
      if (!baseId || !updates || typeof updates !== 'object') {
        throw new AppError(400, 'Données de mise à jour invalides');
      }
      const base = await this.getBase(baseId);
      const updatedData = {
        name: updates.name !== undefined ? updates.name : base.name,
        defenses: updates.defenses !== undefined ? updates.defenses : base.defenses,
        updatedAt: formatTimestamp(),
      };
      await BaseViraleRepository.updateBaseVirale(baseId, updatedData);
      await BaseViraleRepository.cacheBaseVirale(baseId, { ...base, ...updatedData });
      logger.info(`Base virale ${baseId} mise à jour`);
      return { ...base, ...updatedData };
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la base virale', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour de la base');
    }
  }

  async deleteBase(baseId) {
    try {
      if (!baseId) {
        throw new AppError(400, 'ID de base virale invalide');
      }
      await this.getBase(baseId);
      await BaseViraleRepository.deleteBaseVirale(baseId);
      logger.info(`Base virale ${baseId} supprimée`);
    } catch (error) {
      logger.error('Erreur lors de la suppression de la base virale', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de la base');
    }
  }

  async addPathogen(baseId, pathogenId) {
    try {
      if (!baseId || !pathogenId) {
        throw new AppError(400, 'ID de base ou de pathogène invalide');
      }
      const pathogen = await PathogenRepository.getPathogenById(pathogenId);
      if (!pathogen) throw new NotFoundError('Pathogène non trouvé');
      await this.getBase(baseId);
      await BaseViraleRepository.addPathogenToBase(baseId, pathogen);
      const base = await this.getBase(baseId);
      await BaseViraleRepository.cacheBaseVirale(baseId, base);
      logger.info(`Pathogène ${pathogenId} ajouté à la base ${baseId}`);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du pathogène à la base', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'ajout du pathogène');
    }
  }

  async removePathogen(baseId, pathogenId) {
    try {
      if (!baseId || !pathogenId) {
        throw new AppError(400, 'ID de base ou de pathogène invalide');
      }
      const pathogen = await PathogenRepository.getPathogenById(pathogenId);
      if (!pathogen) throw new NotFoundError('Pathogène non trouvé');
      await this.getBase(baseId);
      await BaseViraleRepository.removePathogenFromBase(baseId, pathogen);
      const base = await this.getBase(baseId);
      await BaseViraleRepository.cacheBaseVirale(baseId, base);
      logger.info(`Pathogène ${pathogenId} supprimé de la base ${baseId}`);
    } catch (error) {
      logger.error('Erreur lors de la suppression du pathogène de la base', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du pathogène');
    }
  }

  async updateDefenses(baseId, defenses) {
    try {
      if (!baseId || !defenses || !Array.isArray(defenses)) {
        throw new AppError(400, 'Données de défenses invalides');
      }
      await this.getBase(baseId);
      await BaseViraleRepository.updateBaseDefenses(baseId, defenses);
      const base = await this.getBase(baseId);
      await BaseViraleRepository.cacheBaseVirale(baseId, base);
      logger.info(`Défenses de la base ${baseId} mises à jour`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des défenses de la base', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour des défenses');
    }
  }

  async levelUpBase(baseId) {
    try {
      if (!baseId) {
        throw new AppError(400, 'ID de base virale invalide');
      }
      await this.getBase(baseId);
      await BaseViraleRepository.levelUpBase(baseId);
      const base = await this.getBase(baseId);
      await BaseViraleRepository.cacheBaseVirale(baseId, base);
      logger.info(`Base virale ${baseId} améliorée`);
      return base;
    } catch (error) {
      logger.error('Erreur lors de l\'amélioration de la base', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'amélioration de la base');
    }
  }

  async validateForCombat(baseId) {
    try {
      if (!baseId) {
        throw new AppError(400, 'ID de base virale invalide');
      }
      const isValid = await BaseViraleRepository.validateBaseForCombat(baseId);
      logger.info(`Validation de la base ${baseId} pour combat : ${isValid}`);
      return isValid;
    } catch (error) {
      logger.error('Erreur lors de la validation de la base pour combat', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la validation de la base');
    }
  }
}

module.exports = new BaseViraleService();
