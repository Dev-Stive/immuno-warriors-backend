const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { validateInventoryItem, validateInventoryUpdate } = require('../models/inventoryModel');
const InventoryRepository = require('../repositories/inventoryRepository');
const UserRepository = require('../repositories/userRepository');

class InventoryService {
  async addInventoryItem(userId, itemData) {
    try {
      if (!userId || !itemData) throw new AppError(400, 'Données invalides');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const { error } = validateInventoryItem(itemData);
      if (error) throw new AppError(400, `Données d'élément invalides: ${error.message}`);

      const item = {
        id: itemData.id,
        userId,
        type: itemData.type,
        name: itemData.name,
        quantity: itemData.quantity,
        properties: itemData.properties || {},
      };
      await InventoryRepository.addInventoryItem(item);
      logger.info(`Élément ${item.id} ajouté à l'inventaire de l'utilisateur ${userId}`);
      return item;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout à l\'inventaire', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'ajout à l\'inventaire');
    }
  }

  async getInventoryItem(itemId) {
    try {
      if (!itemId) throw new AppError(400, 'ID d\'élément invalide');
      const item = await InventoryRepository.getCachedInventoryItem(itemId) ||
        await InventoryRepository.getInventoryItem(itemId);
      if (!item) throw new NotFoundError('Élément d\'inventaire non trouvé');
      logger.info(`Élément d'inventaire ${itemId} récupéré`);
      return item;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'élément d\'inventaire', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de l\'élément');
    }
  }

  async getUserInventory(userId) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const inventory = await InventoryRepository.getUserInventory(userId);
      logger.info(`Inventaire récupéré pour l'utilisateur ${userId}`);
      return inventory;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'inventaire de l\'utilisateur', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de l\'inventaire');
    }
  }

  async updateInventoryItem(itemId, updates) {
    try {
      if (!itemId || !updates) throw new AppError(400, 'Données invalides');
      const { error } = validateInventoryUpdate(updates);
      if (error) throw new AppError(400, `Données de mise à jour invalides: ${error.message}`);

      const item = await InventoryRepository.getInventoryItem(itemId);
      if (!item) throw new NotFoundError('Élément d\'inventaire non trouvé');

      await InventoryRepository.updateInventoryItem(itemId, updates);
      logger.info(`Élément d'inventaire ${itemId} mis à jour`);
      return { id: itemId, ...updates };
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de l\'élément d\'inventaire', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour de l\'élément');
    }
  }

  async deleteInventoryItem(itemId) {
    try {
      if (!itemId) throw new AppError(400, 'ID d\'élément invalide');
      const item = await InventoryRepository.getInventoryItem(itemId);
      if (!item) throw new NotFoundError('Élément d\'inventaire non trouvé');

      await InventoryRepository.deleteInventoryItem(itemId);
      logger.info(`Élément d'inventaire ${itemId} supprimé`);
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'élément d\'inventaire', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de l\'élément');
    }
  }
}

module.exports = new InventoryService();
