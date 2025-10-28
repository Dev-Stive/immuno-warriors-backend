const { db } = require('../services/firebaseService');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../utils/errorUtils');
const logger = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');
const { validateProgression, fromFirestore, toFirestore } = require('../models/progressionModel');

class ProgressionRepository {
  constructor() {
    this.collection = db.collection('progressions');
  }

  async getProgression(userId) {
    try {
      const doc = await this.collection.doc(userId).get();
      if (!doc.exists) return null;
      return fromFirestore(doc.data());
    } catch (error) {
      logger.error('Erreur lors de la récupération de la progression', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de la progression');
    }
  }

  async updateProgression(userId, progression) {
    const validation = validateProgression(progression);
    if (validation.error) {
      throw new AppError(400, 'Données de progression invalides', validation.error.details);
    }
    try {
      await this.collection.doc(userId).set({
        ...toFirestore(progression),
        updatedAt: formatTimestamp(),
      });
      logger.info(`Progression de l'utilisateur ${userId} mise à jour`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la progression', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour de la progression');
    }
  }

  async addXP(userId, xp) {
    try {
      const doc = await this.collection.doc(userId).get();
      let progression = doc.exists ? fromFirestore(doc.data()) : { userId, level: 1, xp: 0, rank: null };
      progression.xp += xp;

      const xpForNextLevel = progression.level * 1000;
      if (progression.xp >= xpForNextLevel) {
        progression.level += 1;
        progression.xp -= xpForNextLevel;
        progression.rank = this._calculateRank(progression.level);
      }

      await this.collection.doc(userId).set({
        ...toFirestore(progression),
        updatedAt: formatTimestamp(),
      });
      logger.info(`XP ${xp} ajouté pour l'utilisateur ${userId}, niveau ${progression.level}`);
      return fromFirestore(progression);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout d\'XP', { error });
      throw new AppError(500, 'Erreur serveur lors de l\'ajout d\'XP');
    }
  }

  async completeMission(userId, missionId) {
    try {
      const doc = await this.collection.doc(userId).get();
      const progression = doc.exists ? fromFirestore(doc.data()) : { userId, level: 1, xp: 0, rank: null, missions: [] };
      if (!progression.missions) progression.missions = [];
      if (!progression.missions.includes(missionId)) {
        progression.missions.push(missionId);
        await this.collection.doc(userId).set({
          ...toFirestore(progression),
          updatedAt: formatTimestamp(),
        });
        logger.info(`Mission ${missionId} complétée pour l'utilisateur ${userId}`);
      }
    } catch (error) {
      logger.error('Erreur lors de la complétion de la mission', { error });
      throw new AppError(500, 'Erreur serveur lors de la complétion de la mission');
    }
  }

  _calculateRank(level) {
    if (level >= 20) return 'gold';
    if (level >= 10) return 'silver';
    return 'bronze';
  }
}

module.exports = new ProgressionRepository();
