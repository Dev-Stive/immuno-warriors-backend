const { db } = require('../services/firebaseService');
const { v4: uuidv4 } = require('uuid');
const { validateCombatReport, fromFirestore, toFirestore } = require('../models/combatReportModel');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');

class CombatRepository {
  constructor() {
    this.collection = db.collection('combatReports');
    this.cacheCollection = db.collection('combatCache');
  }

  async saveCombatReport(combatResult) {
    const validation = validateCombatReport(combatResult);
    if (validation.error) {
      throw new AppError(400, 'Données de combat invalides', validation.error.details);
    }
    const combatId = combatResult.combatId || uuidv4();
    try {
      const data = toFirestore({
        ...combatResult,
        combatId,
        createdAt: formatTimestamp(),
        updatedAt: formatTimestamp(),
        deleted: false,
      });
      await this.collection.doc(combatId).set(data);
      await this.cacheCombatReport(combatId, data);
      logger.info(`Rapport de combat ${combatId} sauvegardé`);
      return combatId;
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du combat', { error });
      throw new AppError(500, 'Erreur serveur lors de la sauvegarde du combat');
    }
  }

  async getCombatReport(combatId) {
    try {
      const doc = await this.collection.doc(combatId).get();
      if (!doc.exists) return null;
      const report = fromFirestore(doc.data());
      if (report.deleted) return null;
      return report;
    } catch (error) {
      logger.error('Erreur lors de la récupération du rapport de combat', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération du rapport');
    }
  }

  async getPaginatedCombatHistory(userId, page = 1, limit = 10) {
    try {
      const snapshot = await this.collection
        .where('userId', '==', userId)
        .where('deleted', '==', false)
        .orderBy('date', 'desc')
        .offset((page - 1) * limit)
        .limit(limit)
        .get();
      return snapshot.docs.map(doc => fromFirestore(doc.data()));
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'historique des combats', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de l\'historique');
    }
  }

  async simulateCombat(userId, baseId, pathogens, antibodies) {
    try {
      const combatId = uuidv4();
      let pathogenHealth = pathogens.reduce((sum, p) => sum + (p.health || 100), 0);
      let antibodyHealth = antibodies.reduce((sum, a) => sum + (a.health || 100), 0);
      const log = [];
      let damageDealt = 0;
      let damageTaken = 0;
      const unitsDeployed = [...pathogens.map(p => p.id), ...antibodies.map(a => a.id)];
      const unitsLost = [];

      let round = 1;
      while (pathogenHealth > 0 && antibodyHealth > 0 && round <= 10) {
        const antibodyDamage = antibodies.reduce((sum, a) => sum + (a.damage || 10), 0);
        pathogenHealth = Math.max(0, pathogenHealth - antibodyDamage);
        damageDealt += antibodyDamage;

        const pathogenDamage = pathogens.reduce((sum, p) => sum + (p.attack || 10), 0);
        antibodyHealth = Math.max(0, antibodyHealth - pathogenDamage);
        damageTaken += pathogenDamage;

        log.push(`Tour ${round}: Anticorps infligent ${antibodyDamage} dégâts, pathogènes infligent ${pathogenDamage} dégâts.`);

        if (pathogenHealth <= 0) {
          pathogens.forEach(p => unitsLost.push(p.id));
        }
        if (antibodyHealth <= 0) {
          antibodies.forEach(a => unitsLost.push(a.id));
        }
        round++;
      }

      const result = pathogenHealth <= 0 ? 'victory' : antibodyHealth <= 0 ? 'defeat' : 'draw';
      const combatResult = {
        combatId,
        userId,
        baseId,
        date: formatTimestamp(),
        result,
        log,
        damageDealt,
        damageTaken,
        unitsDeployed,
        unitsLost,
        antibodiesUsed: antibodies,
        pathogenFought: pathogens.length > 0 ? pathogens : null,
      };

      const savedCombatId = await this.saveCombatReport(combatResult);
      logger.info(`Combat simulé : ${savedCombatId}, résultat : ${result}`);
      return combatResult;
    } catch (error) {
      logger.error('Erreur lors de la simulation du combat', { error });
      throw new AppError(500, 'Erreur serveur lors de la simulation du combat');
    }
  }

  async generateCombatChronicle(combatId) {
    try {
      const combat = await this.getCombatReport(combatId);
      if (!combat) throw new NotFoundError('Combat non trouvé');

      let chronicle = `Combat ${combatId} - ${combat.date}\n`;
      chronicle += `Base: ${combat.baseId}\n`;
      chronicle += `Pathogènes (${combat.pathogenFought?.length || 0}) vs Anticorps (${combat.antibodiesUsed?.length || 0})\n`;

      combat.log.forEach((entry, index) => {
        chronicle += `Tour ${index + 1}: ${entry}\n`;
      });

      chronicle += `Résultat : ${combat.result === 'victory' ? 'Victoire des anticorps !' : 
        combat.result === 'defeat' ? 'Victoire des pathogènes !' : 'Match nul.'}\n`;
      chronicle += `Dégâts infligés: ${combat.damageDealt}, Dégâts reçus: ${combat.damageTaken}`;

      logger.info(`Chronique générée pour le combat ${combatId}`);
      return chronicle;
    } catch (error) {
      logger.error('Erreur lors de la génération de la chronique', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la génération de la chronique');
    }
  }

  async getCombatTacticalAdvice(combatId) {
    try {
      const combat = await this.getCombatReport(combatId);
      if (!combat) throw new NotFoundError('Combat non trouvé');

      const advice = [];
      const totalPathogenAttack = combat.pathogenFought?.reduce((sum, p) => sum + (p.attack || 10), 0) || 0;
      const totalAntibodyAttack = combat.antibodiesUsed?.reduce((sum, a) => sum + (a.damage || 10), 0) || 0;

      if (totalPathogenAttack > totalAntibodyAttack) {
        advice.push('Renforcez vos anticorps avec des unités à plus forte attaque pour contrer les pathogènes.');
      } else {
        advice.push('Vos anticorps ont une bonne attaque, concentrez-vous sur l\'amélioration de leur santé.');
      }

      if (combat.log.length >= 10) {
        advice.push('Le combat a duré longtemps, envisagez des unités avec des capacités spéciales pour accélérer les victoires.');
      }

      if (combat.result === 'defeat') {
        advice.push('Analysez les types de pathogènes pour déployer des anticorps avec des préférences de cible adaptées.');
      }

      logger.info(`Conseils tactiques générés pour le combat ${combatId}`);
      return advice;
    } catch (error) {
      logger.error('Erreur lors de la génération des conseils tactiques', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la génération des conseils');
    }
  }

  async startRealTimeCombat(userId, combatConfig) {
    try {
      const combatId = uuidv4();
      const combatData = {
        combatId,
        userId,
        date: formatTimestamp(),
        status: 'InProgress',
        config: combatConfig,
        createdAt: formatTimestamp(),
        updatedAt: formatTimestamp(),
        deleted: false,
      };
      await this.collection.doc(combatId).set(toFirestore(combatData));
      await this.cacheCombatReport(combatId, combatData);
      logger.info(`Combat en temps réel démarré : ${combatId} pour l'utilisateur ${userId}`);
      return combatId;
    } catch (error) {
      logger.error('Erreur lors du démarrage du combat en temps réel', { error });
      throw new AppError(500, 'Erreur serveur lors du démarrage du combat en temps réel');
    }
  }

  async updateCombatStatus(combatId, status) {
    try {
      await this.collection.doc(combatId).update({
        status,
        updatedAt: formatTimestamp(),
      });
      logger.info(`Statut du combat ${combatId} mis à jour : ${status}`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut du combat', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour du statut du combat');
    }
  }

  async cacheCombatReport(combatId, combatData) {
    try {
      if (combatData) {
        await this.cacheCollection.doc(combatId).set({
          ...toFirestore(combatData),
          cachedAt: formatTimestamp(),
        });
        logger.info(`Rapport de combat ${combatId} mis en cache`);
      } else {
        await this.cacheCollection.doc(combatId).delete();
        logger.info(`Cache du rapport de combat ${combatId} supprimé`);
      }
    } catch (error) {
      logger.error('Erreur lors de la mise en cache du rapport', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise en cache du rapport');
    }
  }

  async getCachedCombatReport(combatId) {
    try {
      const doc = await this.cacheCollection.doc(combatId).get();
      if (!doc.exists) return null;
      const report = fromFirestore(doc.data());
      if (report.deleted) return null;
      return report;
    } catch (error) {
      logger.error('Erreur lors de la récupération du rapport en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération du rapport en cache');
    }
  }

  async clearCachedCombatReports() {
    try {
      const snapshot = await this.cacheCollection.get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      logger.info('Tous les rapports de combat en cache ont été supprimés');
    } catch (error) {
      logger.error('Erreur lors de la suppression des rapports en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression des rapports en cache');
    }
  }
}

module.exports = new CombatRepository();
