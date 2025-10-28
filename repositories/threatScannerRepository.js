const { db } = require('../services/firebaseService');
const { v4: uuidv4 } = require('uuid');
const { validateThreat, fromFirestore, toFirestore } = require('../models/threatModel');
const { AppError } = require('../utils/errorUtils');
const logger = require('../utils/logger');
const { formatTimestamp } = require('../utils/syncUtils');

class ThreatScannerRepository {
  constructor() {
    this.collection = db.collection('threats');
    this.cacheCollection = db.collection('threatCache');
  }

  async getThreat(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) return null;
      return fromFirestore(doc.data());
    } catch (error) {
      logger.error('Erreur lors de la récupération de la menace', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de la menace');
    }
  }

  async addThreat(threat) {
    const validation = validateThreat(threat);
    if (validation.error) {
      throw new AppError(400, 'Données de menace invalides', validation.error.details);
    }
    const threatId = threat.id || uuidv4();
    try {
      await this.collection.doc(threatId).set(toFirestore({ ...threat, id: threatId }));
      logger.info(`Menace ${threatId} ajoutée`);
      return threatId;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de la menace', { error });
      throw new AppError(500, 'Erreur serveur lors de l\'ajout de la menace');
    }
  }

  async cacheThreat(threatId, threatData) {
    try {
      await this.cacheCollection.doc(threatId).set({
        ...toFirestore(threatData),
        cachedAt: formatTimestamp(),
      });
      logger.info(`Menace ${threatId} mise en cache`);
    } catch (error) {
      logger.error('Erreur lors de la mise en cache de la menace', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise en cache de la menace');
    }
  }

  async getCachedThreat(threatId) {
    try {
      const doc = await this.cacheCollection.doc(threatId).get();
      if (!doc.exists) return null;
      return fromFirestore(doc.data());
    } catch (error) {
      logger.error('Erreur lors de la récupération de la menace en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de la menace en cache');
    }
  }

  async clearCachedThreats() {
    try {
      const snapshot = await this.cacheCollection.get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      logger.info('Toutes les menaces en cache ont été supprimées');
    } catch (error) {
      logger.error('Erreur lors de la suppression des menaces en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression des menaces en cache');
    }
  }
}

module.exports = new ThreatScannerRepository();
