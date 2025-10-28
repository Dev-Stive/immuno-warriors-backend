const { v4: uuidv4 } = require('uuid');
const { db } = require('../services/firebaseService');
const { validateAntibody, fromFirestore, toFirestore } = require('../models/antibodyModel');
const { AppError } = require('../utils/errorUtils');
const logger = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');

class AntibodyRepository {
  constructor() {
    this.collection = db.collection('antibodies');
    this.cacheCollection = db.collection('antibodyCache');
    this.pathogenCollection = db.collection('pathogens');
  }

  async getAntibodyById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) return null;
      const antibody = fromFirestore(doc.data());
      if (antibody.deleted) return null;
      return antibody;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'anticorps', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de l\'anticorps');
    }
  }

  async createAntibody(antibody) {
    const validation = validateAntibody(antibody);
    if (validation.error) {
      throw new AppError(400, 'Données d\'anticorps invalides', validation.error.details);
    }
    const antibodyId = antibody.id || uuidv4();
    try {
      const data = toFirestore({ ...antibody, id: antibodyId, createdAt: formatTimestamp(), updatedAt: formatTimestamp() });
      await this.collection.doc(antibodyId).set(data);
      logger.info(`Anticorps ${antibodyId} créé`);
      return antibodyId;
    } catch (error) {
      logger.error('Erreur lors de la création de l\'anticorps', { error });
      throw new AppError(500, 'Erreur serveur lors de la création de l\'anticorps');
    }
  }

  async updateAntibody(id, updates) {
    try {
      const data = toFirestore({ ...updates, updatedAt: formatTimestamp() });
      await this.collection.doc(id).update(data);
      logger.info(`Anticorps ${id} mis à jour`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de l\'anticorps', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour de l\'anticorps');
    }
  }

  async getAntibodiesByType(type) {
    try {
      const snapshot = await this.collection.where('type', '==', type).get();
      return snapshot.docs
        .map(doc => fromFirestore(doc.data()))
        .filter(antibody => !antibody.deleted);
    } catch (error) {
      logger.error('Erreur lors de la récupération des anticorps par type', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des anticorps par type');
    }
  }

  async getAllAntibodies() {
    try {
      const snapshot = await this.collection.get();
      return snapshot.docs
        .map(doc => fromFirestore(doc.data()))
        .filter(antibody => !antibody.deleted);
    } catch (error) {
      logger.error('Erreur lors de la récupération de tous les anticorps', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de tous les anticorps');
    }
  }

  async deleteAntibody(id) {
    try {
      await this.collection.doc(id).update({ deleted: true, updatedAt: formatTimestamp() });
      await this.cacheCollection.doc(id).delete();
      logger.info(`Anticorps ${id} marqué comme supprimé`);
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'anticorps', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression de l\'anticorps');
    }
  }

  async getAntibodiesByAttackType(attackType) {
    try {
      const snapshot = await this.collection.where('attackType', '==', attackType).get();
      return snapshot.docs
        .map(doc => fromFirestore(doc.data()))
        .filter(antibody => !antibody.deleted);
    } catch (error) {
      logger.error('Erreur lors de la récupération des anticorps par type d\'attaque', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des anticorps par type d\'attaque');
    }
  }

  async createBatchAntibodies(antibodies) {
    try {
      const batch = db.batch();
      const ids = [];
      antibodies.forEach(antibody => {
        const validation = validateAntibody(antibody);
        if (validation.error) {
          throw new AppError(400, `Données d'anticorps invalides pour ${antibody.id}`, validation.error.details);
        }
        const antibodyId = antibody.id || uuidv4();
        const docRef = this.collection.doc(antibodyId);
        batch.set(docRef, toFirestore({ ...antibody, id: antibodyId, createdAt: formatTimestamp(), updatedAt: formatTimestamp() }));
        ids.push(antibodyId);
      });
      await batch.commit();
      logger.info(`${antibodies.length} anticorps créés en lot`);
      return ids;
    } catch (error) {
      logger.error('Erreur lors de la création du lot d\'anticorps', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création du lot d\'anticorps');
    }
  }

  async cacheAntibody(antibodyId, antibodyData) {
    try {
      if (antibodyData) {
        await this.cacheCollection.doc(antibodyId).set({
          ...toFirestore(antibodyData),
          cachedAt: formatTimestamp(),
        });
        logger.info(`Anticorps ${antibodyId} mis en cache`);
      } else {
        await this.cacheCollection.doc(antibodyId).delete();
        logger.info(`Cache de l'anticorps ${antibodyId} supprimé`);
      }
    } catch (error) {
      logger.error('Erreur lors de la mise en cache de l\'anticorps', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise en cache de l\'anticorps');
    }
  }

  async getCachedAntibody(antibodyId) {
    try {
      const doc = await this.cacheCollection.doc(antibodyId).get();
      if (!doc.exists) return null;
      const antibody = fromFirestore(doc.data());
      if (antibody.deleted) return null;
      return antibody;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'anticorps en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de l\'anticorps en cache');
    }
  }

  async clearCachedAntibodies() {
    try {
      const snapshot = await this.cacheCollection.get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      logger.info('Tous les anticorps en cache ont été supprimés');
    } catch (error) {
      logger.error('Erreur lors de la suppression des anticorps en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression des anticorps en cache');
    }
  }

  async getPathogenById(pathogenId) {
    try {
      const doc = await this.pathogenCollection.doc(pathogenId).get();
      if (!doc.exists) return null;
      return fromFirestore(doc.data());
    } catch (error) {
      logger.error('Erreur lors de la récupération du pathogène', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération du pathogène');
    }
  }
}

module.exports = new AntibodyRepository();
