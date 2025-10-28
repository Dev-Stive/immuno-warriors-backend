const { db } = require('../services/firebaseService');
const { v4: uuidv4 } = require('uuid');
const { validatePathogen, fromFirestore, toFirestore } = require('../models/pathogenModel');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');

class PathogenRepository {
  constructor() {
    this.collection = db.collection('pathogens');
    this.cacheCollection = db.collection('pathogenCache');
  }

  async getAllPathogens(page = 1, limit = 10) {
    try {
      const snapshot = await this.collection
        .where('deleted', '==', false)
        .orderBy('createdAt', 'desc')
        .offset((page - 1) * limit)
        .limit(limit)
        .get();
      return snapshot.docs.map(doc => fromFirestore(doc.data()));
    } catch (error) {
      logger.error('Erreur lors de la récupération des pathogènes', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des pathogènes');
    }
  }

  async getPathogenById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) return null;
      const pathogen = fromFirestore(doc.data());
      if (pathogen.deleted) return null;
      return pathogen;
    } catch (error) {
      logger.error('Erreur lors de la récupération du pathogène', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération du pathogène');
    }
  }

  async createPathogen(pathogen) {
    const validation = validatePathogen(pathogen);
    if (validation.error) {
      throw new AppError(400, 'Données de pathogène invalides', validation.error.details);
    }
    const pathogenId = pathogen.id || uuidv4();
    try {
      const data = toFirestore({
        ...pathogen,
        id: pathogenId,
        createdAt: formatTimestamp(),
        updatedAt: formatTimestamp(),
        deleted: false,
      });
      await this.collection.doc(pathogenId).set(data);
      await this.cachePathogen(pathogenId, data);
      logger.info(`Pathogène ${pathogenId} créé`);
      return pathogenId;
    } catch (error) {
      logger.error('Erreur lors de la création du pathogène', { error });
      throw new AppError(500, 'Erreur serveur lors de la création du pathogène');
    }
  }

  async getPathogensByType(type, page = 1, limit = 10) {
    try {
      const snapshot = await this.collection
        .where('type', '==', type)
        .where('deleted', '==', false)
        .orderBy('createdAt', 'desc')
        .offset((page - 1) * limit)
        .limit(limit)
        .get();
      return snapshot.docs.map(doc => fromFirestore(doc.data()));
    } catch (error) {
      logger.error('Erreur lors de la récupération des pathogènes par type', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des pathogènes par type');
    }
  }

  async getPathogensByRarity(rarity, page = 1, limit = 10) {
    try {
      const snapshot = await this.collection
        .where('rarity', '==', rarity)
        .where('deleted', '==', false)
        .orderBy('createdAt', 'desc')
        .offset((page - 1) * limit)
        .limit(limit)
        .get();
      return snapshot.docs.map(doc => fromFirestore(doc.data()));
    } catch (error) {
      logger.error('Erreur lors de la récupération des pathogènes par rareté', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des pathogènes par rareté');
    }
  }

  async updatePathogen(id, updates) {
    const validation = validatePathogen({ id, ...updates });
    if (validation.error) {
      throw new AppError(400, 'Données de pathogène invalides', validation.error.details);
    }
    try {
      const data = toFirestore({
        ...updates,
        updatedAt: formatTimestamp(),
      });
      await this.collection.doc(id).update(data);
      const updatedPathogen = await this.getPathogenById(id);
      await this.cachePathogen(id, updatedPathogen);
      logger.info(`Pathogène ${id} mis à jour`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du pathogène', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour du pathogène');
    }
  }

  async deletePathogen(id) {
    try {
      await this.collection.doc(id).update({
        deletedAt: true,
        updatedAt: formatTimestamp(),
      });
      await this.cacheCollection.doc(id).delete();
      logger.info('Pathogène ${id} marqué comme supprimé');
    } catch (error) {
      logger.error('Erreur lors de la suppression du pathogène', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression du pathogène');
    }
  }

  async createBatchPathogens(pathogens) {
    try {
      const batch = db.batch();
      const ids = [];
      for (const pathogen of pathogens) {
        const validation = validatePathogen(pathogen);
        if (validation.error) {
          throw new AppError(400, `Données de pathogène invalides pour ${pathogen.id || 'nouveau'}`, validation.error.details);
        }
        const pathogenId = pathogen.id || uuidv4();
        const docRef = this.collection.doc(pathogenId);
        batch.set(docRef, {
          ...toFirestore({
            ...pathogen,
            id: pathogenId,
            createdAt: formatTimestamp(),
            updatedAt: formatTimestamp(),
            deleted: false,
          }),
        });
        ids.push(pathogenId);
      }
      await batch.commit();
      for (const id of ids) {
        const pathogen = pathogens.find(p => p.id === id) || pathogens[ids.indexOf(id)];
        await this.cachePathogen(id, { ...pathogen, id });
      }
      logger.info(`${ids.length} pathogènes créés en lot`);
      return ids;
    } catch (error) {
      logger.error('Erreur lors de la création du lot de pathogènes', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création du lot de pathogènes');
    }
  }

  async cachePathogen(pathogenId, pathogenData) {
    try {
      if (pathogenData) {
        await this.cacheCollection.doc(pathogenId).set({
          ...toFirestore(pathogenData),
          cachedAt: formatTimestamp(),
        });
        logger.info(`Pathogène ${pathogenId} mis en cache`);
      } else {
        await this.cacheCollection.doc(pathogenId).delete();
        logger.info(`Cache du pathogène ${pathogenId} supprimé`);
      }
    } catch (error) {
      logger.error('Erreur lors de la mise en cache du pathogène', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise en cache du pathogène');
    }
  }

  async getCachedPathogen(pathogenId) {
    try {
      const doc = await this.cacheCollection.doc(pathogenId).get();
      if (!doc.exists) return null;
      const pathogen = fromFirestore(doc.data());
      if (pathogen.deleted) return null;
      return pathogen;
    } catch (error) {
      logger.error('Erreur lors de la récupération du pathogène en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération du pathogène en cache');
    }
  }

  async clearCachedPathogens() {
    try {
      const snapshot = await this.cacheCollection.get();
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      logger.info('Tous les pathogènes en cache ont été supprimés');
    } catch (error) {
      logger.error('Erreur lors de la suppression des pathogènes en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression des pathogènes en cache');
    }
  }
}

module.exports = new PathogenRepository();

