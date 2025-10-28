const { v4: uuidv4 } = require('uuid');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/dateUtils');
const { formatTimestamp } = require('../utils/dateUtils');
const AntibodyRepository = require('../repositories/antibodyRepository');
//const { v4: } = require('../utils/validationUtils');

class AntibodyService {
  async createAntibody(antibodyData) {
    try {
      if (!antibodyData || typeof antibodyData !== 'object') {
        throw new AppError(400, 'Données d\'anticorps invalides');
      }
      const antibodyId = uuidv4();
      const antibody = {
        id: antibodyId,
        type: antibodyData.type,
        name: antibodyData.name,
        attackType: antibodyData.attackType,
        damage: antibodyData.stats?.damage || 0,
        range: antibodyData.stats?.range || 0,
        cost: antibodyData.stats?.cost || 0,
        efficiency: antibodyData.stats?.efficiency || 0,
        health: antibodyData.stats?.health || 0,
        maxHealth: antibodyData.stats?.maxHealth || 0,
        specialAbility: antibodyData.specialAbility || null,
        targetPreferences: antibodyData.targetPreferences || null,
        createdAt: formatTimestamp(),
        updatedAt: formatTimestamp(),
      };
      const createdId = await AntibodyRepository.createAntibody(antibody);
      await AntibodyRepository.cacheAntibody(antibodyId, antibody);
      logger.info(`Anticorps ${antibodyId} créé`);
      return { ...antibody, id: createdId };
    } catch (error) {
      logger.error('Erreur lors de la création de l\'anticorps', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création de l\'anticorps');
    }
  }

  async getAntibody(antibodyId) {
    try {
      if (!antibodyId || typeof antibodyId !== 'string') {
        throw new AppError(400, 'ID d\'anticorps invalide');
      }
      const antibody = await AntibodyRepository.getCachedAntibody(antibodyId) ||
        await AntibodyRepository.getAntibodyById(antibodyId);
      if (!antibody) throw new NotFoundError('Anticorps non trouvé');
      logger.info(`Anticorps ${antibodyId} récupéré`);
      return antibody;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'anticorps', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de l\'anticorps');
    }
  }

  async getAntibodiesByType(type) {
    try {
      if (!['igG', 'igM', 'igA', 'igD', 'igE'].includes(type)) {
        throw new AppError(400, 'Type d\'anticorps invalide');
      }
      const antibodies = await AntibodyRepository.getAntibodiesByType(type);
      logger.info(`Récupération de ${antibodies.length} anticorps pour le type ${type}`);
      return antibodies;
    } catch (error) {
      logger.error('Erreur lors de la récupération des anticorps par type', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des anticorps par type');
    }
  }

  async getAllAntibodies() {
    try {
      const antibodies = await AntibodyRepository.getAllAntibodies();
      logger.info(`Récupération de ${antibodies.length} anticorps`);
      return antibodies;
    } catch (error) {
      logger.error('Erreur lors de la récupération de tous les anticorps', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de tous les anticorps');
    }
  }

  async updateAntibodyStats(antibodyId, stats) {
    try {
      if (!antibodyId || !stats || typeof stats !== 'object') {
        throw new AppError(400, 'Données de mise à jour invalides');
      }
      const antibody = await this.getAntibody(antibodyId);
      const updates = {
        damage: stats.damage !== undefined ? stats.damage : antibody.damage,
        range: stats.range !== undefined ? stats.range : antibody.range,
        cost: stats.cost !== undefined ? stats.cost : antibody.cost,
        efficiency: stats.efficiency !== undefined ? stats.efficiency : antibody.efficiency,
        health: stats.health !== undefined ? stats.health : antibody.health,
        maxHealth: stats.maxHealth !== undefined ? stats.maxHealth : antibody.maxHealth,
        specialAbility: stats.specialAbility !== undefined ? stats.specialAbility : antibody.specialAbility,
        targetPreferences: stats.targetPreferences !== undefined ? stats.targetPreferences : antibody.targetPreferences,
        updatedAt: formatTimestamp(),
      };
      await AntibodyRepository.updateAntibody(antibodyId, updates);
      await AntibodyRepository.cacheAntibody(antibodyId, { ...antibody, ...updates });
      logger.info(`Statistiques de l'anticorps ${antibodyId} mises à jour`);
      return { ...antibody, ...updates };
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des statistiques de l\'anticorps', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour des statistiques');
    }
  }

  async deleteAntibody(antibodyId) {
    try {
      if (!antibodyId) {
        throw new AppError(400, 'ID d\'anticorps invalide');
      }
      await this.getAntibody(antibodyId);
      await AntibodyRepository.deleteAntibody(antibodyId);
      logger.info(`Anticorps ${antibodyId} supprimé`);
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'anticorps', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de l\'anticorps');
    }
  }

  async assignSpecialAbility(antibodyId, specialAbility) {
    try {
      if (!antibodyId || !specialAbility) {
        throw new AppError(400, 'Paramètres invalides');
      }
      const antibody = await this.getAntibody(antibodyId);
      const updates = {
        specialAbility,
        updatedAt: formatTimestamp(),
      };
      await AntibodyRepository.updateAntibody(antibodyId, updates);
      await AntibodyRepository.cacheAntibody(antibodyId, { ...antibody, ...updates });
      logger.info(`Capacité spéciale assignée à l'anticorps ${antibodyId}`);
      return { ...antibody, ...updates };
    } catch (error) {
      logger.error('Erreur lors de l\'assignation de la capacité spéciale', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'assignation de la capacité spéciale');
    }
  }

  async simulateCombatEffect(antibodyId, pathogenId) {
    try {
      if (!antibodyId || !pathogenId) {
        throw new AppError(400, 'ID d\'anticorps ou de pathogène invalide');
      }
      const antibody = await this.getAntibody(antibodyId);
      const pathogen = await AntibodyRepository.getPathogenById(pathogenId);
      if (!pathogen) throw new NotFoundError('Pathogène non trouvé');

      let damage = antibody.damage;
      if (antibody.targetPreferences?.pathogenType === pathogen.type) {
        damage *= (1 + (antibody.targetPreferences.bonus || 0));
      }

      const efficiencyFactor = antibody.efficiency;
      const effectiveDamage = damage * efficiencyFactor;
      const damageAfterResistance = effectiveDamage * (1 - (pathogen.resistance || 0));

      const result = {
        antibodyId,
        pathogenId,
        damageDealt: Math.max(0, damageAfterResistance),
        efficiency: efficiencyFactor,
        bonusApplied: antibody.targetPreferences?.pathogenType === pathogen.type ? antibody.targetPreferences.bonus || 0 : 0,
      };

      logger.info(`Simulation de combat pour l'anticorps ${antibodyId} contre le pathogène ${pathogenId}`);
      return result;
    } catch (error) {
      logger.error('Erreur lors de la simulation de combat', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la simulation de combat');
    }
  }
}

module.exports = new AntibodyService();
