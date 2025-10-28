const { db } = require('../services/firebaseService');
const { v4: uuidv4 } = require('uuid');
const { validateMemorySignature, fromFirestore, toFirestore } = require('../models/memorySignatureModel');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { formatTimestamp, isExpired } = require('../utils/dateUtils');

class MemoryRepository {
  constructor() {
    this.collection = db.collection('memorySignatures');
    this.cacheCollection = db.collection('memoryCache');
  }

  async getMemorySignatures(userId) {
    try {
      const snapshot = await this.collection
        .where('userId', '==', userId)
        .where('deleted', '==', false)
        .get();
      return snapshot.docs.map(doc => fromFirestore(doc.data()));
    } catch (error) {
      logger.error('Erreur lors de la récupération des signatures mémoire', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des signatures mémoire');
    }
  }

  async addMemorySignature(userId, signature) {
    const validation = validateMemorySignature(signature);
    if (validation.error) {
      throw new AppError(400, 'Données de signature mémoire invalides', validation.error.details);
    }
    const signatureId = signature.id || uuidv4();
    try {
      const data = toFirestore({
        ...signature,
        userId,
        id: signatureId,
        createdAt: formatTimestamp(),
        updatedAt: formatTimestamp(),
        deleted: false,
      });
      await this.collection.doc(signatureId).set(data);
      await this.cacheMemorySignature(signatureId, data);
      logger.info(`Signature mémoire ${signatureId} ajoutée pour l'utilisateur ${userId}`);
      return signatureId;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de la signature mémoire', { error });
      throw new AppError(500, 'Erreur serveur lors de l\'ajout de la signature mémoire');
    }
  }

  async clearExpiredMemorySignatures() {
    try {
      const snapshot = await this.collection
        .where('deleted', '==', false)
        .get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.expiryDate && isExpired(data.expiryDate)) {
          batch.update(doc.ref, {
            deleted: true,
            updatedAt: formatTimestamp(),
          });
        }
      });
      await batch.commit();
      logger.info('Signatures mémoire expirées marquées comme supprimées');
    } catch (error) {
      logger.error('Erreur lors de la suppression des signatures expirées', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression des signatures expirées');
    }
  }

  async addBatchMemorySignatures(userId, signatures) {
    try {
      const batch = db.batch();
      const ids = [];
      for (const signature of signatures) {
        const validation = validateMemorySignature(signature);
        if (validation.error) {
          throw new AppError(400, `Données de signature invalides pour ${signature.id || 'nouveau'}`, validation.error.details);
        }
        const signatureId = signature.id || uuidv4();
        const docRef = this.collection.doc(signatureId);
        const data = toFirestore({
          ...signature,
          userId,
          id: signatureId,
          createdAt: formatTimestamp(),
          updatedAt: formatTimestamp(),
          deleted: false,
        });
        batch.set(docRef, data);
        ids.push(signatureId);
      }
      await batch.commit();
      for (const id of ids) {
        const signature = signatures.find(s => s.id === id) || signatures[ids.indexOf(id)];
        await this.cacheMemorySignature(id, { ...signature, userId, id });
      }
      logger.info(`${signatures.length} signatures mémoire ajoutées pour l'utilisateur ${userId}`);
      return ids;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du lot de signatures', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'ajout du lot de signatures');
    }
  }

  async validateMemorySignature(signatureId) {
    try {
      if (!signatureId) throw new AppError(400, 'ID de signature invalide');
      const doc = await this.collection.doc(signatureId).get();
      if (!doc.exists) return false;
      const signature = fromFirestore(doc.data());
      if (signature.deleted) return false;
      const isValid = !signature.expiryDate || !isExpired(signature.expiryDate);
      logger.info(`Validation de la signature mémoire ${signatureId} : ${isValid}`);
      return isValid;
    } catch (error) {
      logger.error('Erreur lors de la validation de la signature mémoire', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la validation de la signature mémoire');
    }
  }

  async cacheMemorySignature(signatureId, signatureData) {
    try {
      if (signatureData) {
        await this.cacheCollection.doc(signatureId).set({
          ...toFirestore(signatureData),
          cachedAt: formatTimestamp(),
        });
        logger.info(`Signature mémoire ${signatureId} mise en cache`);
      } else {
        await this.cacheCollection.doc(signatureId).delete();
        logger.info(`Cache de la signature mémoire ${signatureId} supprimé`);
      }
    } catch (error) {
      logger.error('Erreur lors de la mise en cache de la signature mémoire', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise en cache de la signature mémoire');
    }
  }

  async getCachedMemorySignatures(userId) {
    try {
      const snapshot = await this.cacheCollection
        .where('userId', '==', userId)
        .where('deleted', '==', false)
        .get();
      return snapshot.docs.map(doc => fromFirestore(doc.data()));
    } catch (error) {
      logger.error('Erreur lors de la récupération des signatures en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des signatures en cache');
    }
  }

  async clearCachedMemorySignatures() {
    try {
      const snapshot = await this.cacheCollection.get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      logger.info('Toutes les signatures mémoire en cache ont été supprimées');
    } catch (error) {
      logger.error('Erreur lors de la suppression des signatures en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression des signatures en cache');
    }
  }
}

module.exports = new MemoryRepository();
