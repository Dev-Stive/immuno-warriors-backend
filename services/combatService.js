const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');
const CombatRepository = require('../repositories/combatRepository');
const UserRepository = require('../repositories/userRepository');
const BaseViraleRepository = require('../repositories/baseViraleRepository');
const PathogenRepository = require('../repositories/pathogenRepository');
const AntibodyRepository = require('../repositories/antibodyRepository');
const GeminiService = require('../services/geminiAiService');



class CombatService {
  async startCombat(userId, combatConfig) {
    try {
      if (!userId || !combatConfig || typeof combatConfig !== 'object') {
        throw new AppError(400, 'Configuration de combat invalide');
      }
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const { baseId, pathogens, antibodies } = combatConfig;
      if (!baseId) throw new AppError(400, 'Base virale requise');
      const isValid = await BaseViraleRepository.validateBaseForCombat(baseId);
      if (!isValid) throw new AppError(400, 'Base virale non valide pour le combat');

      if (pathogens && pathogens.length > 0) {
        for (const pathogen of pathogens) {
          const exists = await PathogenRepository.getPathogenById(pathogen.id);
          if (!exists) throw new NotFoundError(`Pathogène ${pathogen.id} non trouvé`);
        }
      }

      if (antibodies && antibodies.length > 0) {
        for (const antibody of antibodies) {
          const exists = await AntibodyRepository.getAntibodyById(antibody.id);
          if (!exists) throw new NotFoundError(`Anticorps ${antibody.id} non trouvé`);
        }
      }

      const combatId = await CombatRepository.startRealTimeCombat(userId, combatConfig);
      logger.info(`Combat ${combatId} démarré pour l'utilisateur ${userId}`);
      return combatId;
    } catch (error) {
      logger.error('Erreur lors du démarrage du combat', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors du démarrage du combat');
    }
  }

  async endCombat(combatId, pathogens, antibodies) {
    try {
      if (!combatId || (!pathogens && !antibodies)) {
        throw new AppError(400, 'Données de combat invalides');
      }
      const combat = await CombatRepository.getCombatReport(combatId);
      if (!combat) throw new NotFoundError('Combat non trouvé');
      if (combat.status !== 'InProgress') throw new AppError(400, 'Combat déjà terminé');

      const userId = combat.userId;
      const baseId = combat.config?.baseId;
      if (!baseId) throw new AppError(400, 'Base virale requise');

      if (pathogens && pathogens.length > 0) {
        for (const pathogen of pathogens) {
          const exists = await PathogenRepository.getPathogenById(pathogen.id);
          if (!exists) throw new NotFoundError(`Pathogène ${pathogen.id} non trouvé`);
        }
      }

      if (antibodies && antibodies.length > 0) {
        for (const antibody of antibodies) {
          const exists = await AntibodyRepository.getAntibodyById(antibody.id);
          if (!exists) throw new NotFoundError(`Anticorps ${antibody.id} non trouvé`);
        }
      }

      const combatResult = await CombatRepository.simulateCombat(userId, baseId, pathogens || [], antibodies || []);
      await CombatRepository.updateCombatStatus(combatId, 'Completed');

      if (userId) {
        const rewards = this._calculateRewards(combatResult.result);
        await UserRepository.addResources(userId, rewards);
        const progression = await UserRepository.getUserProgression(userId);
        await UserRepository.updateUserProgression(userId, {
          battlesFought: (progression.battlesFought || 0) + 1,
          updatedAt: formatTimestamp(),
        });
      }

      logger.info(`Combat ${combatId} terminé avec résultat ${combatResult.result}`);
      return combatResult;
    } catch (error) {
      logger.error('Erreur lors de la fin du combat', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la fin du combat');
    }
  }

  async getCombatReport(combatId) {
    try {
      if (!combatId) throw new AppError(400, 'ID de combat invalide');
      const report = await CombatRepository.getCachedCombatReport(combatId) ||
        await CombatRepository.getCombatReport(combatId);
      if (!report) throw new NotFoundError('Rapport de combat non trouvé');
      logger.info(`Rapport de combat ${combatId} récupéré`);
      return report;
    } catch (error) {
      logger.error('Erreur lors de la récupération du rapport de combat', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du rapport');
    }
  }

  async getCombatHistory(userId, page = 1, limit = 10) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      if (page < 1 || limit < 1) throw new AppError(400, 'Paramètres de pagination invalides');
      const history = await CombatRepository.getPaginatedCombatHistory(userId, page, limit);
      logger.info(`Historique des combats récupéré pour l'utilisateur ${userId}, page ${page}, limite ${limit}`);
      return history;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'historique des combats', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de l\'historique');
    }
  }

  async generateChronicle(combatId) {
    try {
      if (!combatId) throw new AppError(400, 'ID de combat invalide');

      const chronicle = await GeminiService.generateCombatChronicle(combatId);
      if(chronicle){
      logger.info(`Chronique générée pour le combat ${combatId} via Gemini`)
      }else{
      chronicle = await CombatRepository.generateCombatChronicle(combatId);
      logger.info(`Chronique générée pour le combat ${combatId}`);
      }
      return chronicle;
    } catch (error) {
      logger.error('Erreur lors de la génération de la chronique', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la génération de la chronique');
    }
  }

  async getTacticalAdvice(combatId) {
    try {
      if (!combatId) throw new AppError(400, 'ID de combat invalide');
      const advice = await GeminiService.getTacticalAdvice(combatId);
      if(advice){
      logger.info(`Conseils tactiques générés pour le combat ${combatId} via Gemini`);
      }else{
      advice = await CombatRepository.getCombatTacticalAdvice(combatId);
      logger.info(`Conseils tactiques générés pour le combat ${combatId}`);
      }
      return advice;
    } catch (error) {
      logger.error('Erreur lors de la génération des conseils tactiques', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la génération des conseils');
    }
  }

  _calculateRewards(outcome) {
    const baseRewards = { credits: 100, energy: 50 };
    if (outcome === 'victory') {
      return { credits: baseRewards.credits * 2, energy: baseRewards.energy * 1.5 };
    } else if (outcome === 'defeat') {
      return { credits: baseRewards.credits * 0.5, energy: baseRewards.energy * 0.5 };
    }
    return baseRewards;
  }
}

module.exports = new CombatService();
