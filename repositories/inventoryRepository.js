const { db } = require('../services/firebaseService');
const {  validateInventoryItem, fromFirestore, toFirestore } = require('../models/inventoryModel.js');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');

class InventoryRepository {
  constructor() {
    this.collection = db.collection('inventoryItems');
    this.cacheCollection = db.collection('inventoryCache');
  }

  async addInventoryItem(item) {
    const validation = validateInventoryItem(item);
    if (validation.error) {
      throw new AppError(400, 'Données d\'inventaire invalides', validation.error.details);
    }

    try {
      const data = toFirestore({
        ...item,
        createdAt: formatTimestamp(),
        updatedAt: formatTimestamp(),
        deleted: false,
      });
      await this.collection.doc(item.id).set(data);
      await this.cacheInventoryItem(item.id, data);
      logger.info(`Élément d'inventaire ${item.id} ajouté`);
      return item.id;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de l\'élément d\'inventaire', { error });
      throw new AppError(500, 'Erreur serveur lors de l\'ajout de l\'élément d\'inventaire');
    }
  }

  async getInventoryItem(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) return null;
      const item = fromFirestore(doc.data());
      if (item.deleted) return null;
      return item;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'élément d\'inventaire', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de l\'élément d\'inventaire');
    }
  }

  async getUserInventory(userId) {
    try {
      const snapshot = await this.collection
        .where('userId', '==', userId)
        .where('deleted', '==', false)
        .orderBy('updatedAt', 'desc')
        .get();
      return snapshot.docs.map(doc => fromFirestore(doc.data()));
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'inventaire de l\'utilisateur', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de l\'inventaire de l\'utilisateur');
    }
  }

  async updateInventoryItem(id, updates) {
    const validation = validateInventoryItem({ id, ...updates });
    if (validation.error) {
      throw new AppError(400, 'Données d\'inventaire invalides', validation.error.details);
    }

    try {
      const data = toFirestore({
        ...updates,
        updatedAt: formatTimestamp(),
      });
      await this.collection.doc(id).update(data);
      const item = await this.getInventoryItem(id);
      await this.cacheInventoryItem(id, item);
      logger.info(`Élément d'inventaire ${id} mis à jour`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de l\'élément d\'inventaire', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour de l\'élément d\'inventaire');
    }
  }

  async deleteInventoryItem(id) {
    try {
      await this.collection.doc(id).update({
        deleted: true,
        updatedAt: formatTimestamp(),
      });
      await this.cacheCollection.doc(id).delete();
      logger.info(`Élément d'inventaire ${id} marqué comme supprimé`);
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'élément d\'inventaire', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression de l\'élément d\'inventaire');
    }
  }

  async cacheInventoryItem(itemId, itemData) {
    try {
      if (itemData) {
        await this.cacheCollection.doc(itemId).set({
          ...toFirestore(itemData),
          cachedAt: formatTimestamp(),
        });
        logger.info(`Élément d'inventaire ${itemId} mis en cache`);
      } else {
        await this.cacheCollection.doc(itemId).delete();
        logger.info(`Cache de l'élément d'inventaire ${itemId} supprimé`);
      }
    } catch (error) {
      logger.error('Erreur lors de la mise en cache de l\'élément d\'inventaire', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise en cache de l\'élément d\'inventaire');
    }
  }

  async getCachedInventoryItem(itemId) {
    try {
      const doc = await this.cacheCollection.doc(itemId).get();
      if (!doc.exists) return null;
      const item = fromFirestore(doc.data());
      if (item.deleted) return null;
      return item;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'élément en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de l\'élément en cache');
    }
  }

  async clearCachedInventoryItems() {
    try {
      const snapshot = await this.cacheCollection.get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      logger.info('Tous les éléments d\'inventaire en cache ont été supprimés');
    } catch (error) {
      logger.error('Erreur lors de la suppression des éléments en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression des éléments en cache');
    }
  }
}

module.exports = new InventoryRepository();
