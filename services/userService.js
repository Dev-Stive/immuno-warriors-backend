const { AppError, NotFoundError } = require('../utils/errorUtils');
const logger = require('../utils/logger');
const UserRepository = require('../repositories/userRepository');

class UserService {
  /**
   * Récupère le profil de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<Object>} - Profil utilisateur.
   */
  async getUserProfile(userId) {
    try {
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');
      logger.info(`Profil de ${userId} récupéré`);
      return user;
    } catch (error) {
      logger.error('Erreur lors de la récupération du profil', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération du profil');
    }
  }

  /**
   * Met à jour le profil de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} profile - Données du profil à mettre à jour.
   * @returns {Promise<void>}
   */
  async updateUserProfile(userId, profile) {
    try {
      await UserRepository.updateUserProfile(userId, profile);
      const updatedUser = { ...await UserRepository.getCurrentUser(userId), ...profile };
      await UserRepository.cacheCurrentUser(userId, updatedUser);
      logger.info(`Profil de ${userId} mis à jour`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour du profil');
    }
  }

  /**
   * Ajoute des ressources à l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} resources - Ressources à ajouter.
   * @returns {Promise<void>}
   */
  async addResources(userId, resources) {
    try {
      const currentResources = await UserRepository.getUserResources(userId);
      const updatedResources = {
        credits: (currentResources.credits || 0) + (resources.credits || 0),
        energy: (currentResources.energy || 0) + (resources.energy || 0),
      };
      await UserRepository.updateUserResources(userId, updatedResources);
      const updatedUser = { ...await UserRepository.getCurrentUser(userId), resources: updatedResources };
      await UserRepository.cacheCurrentUser(userId, updatedUser);
      logger.info(`Ressources ajoutées pour ${userId}`);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de ressources', { error });
      throw new AppError(500, 'Erreur serveur lors de l\'ajout de ressources');
    }
  }

  /**
   * Récupère les ressources de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<Object>} - Ressources de l'utilisateur.
   */
  async getUserResources(userId) {
    try {
      const resources = await UserRepository.getUserResources(userId);
      logger.info(`Ressources de ${userId} récupérées`);
      return resources;
    } catch (error) {
      logger.error('Erreur lors de la récupération des ressources', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des ressources');
    }
  }

  /**
   * Ajoute un élément à l'inventaire de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} item - Élément à ajouter.
   * @returns {Promise<void>}
   */
  async addInventoryItem(userId, item) {
    try {
      await UserRepository.addItemToInventory(userId, item);
      const user = await UserRepository.getCurrentUser(userId);
      await UserRepository.cacheCurrentUser(userId, user);
      logger.info(`Élément ajouté à l'inventaire de ${userId}`);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout à l\'inventaire', { error });
      throw new AppError(500, 'Erreur serveur lors de l\'ajout à l\'inventaire');
    }
  }

  /**
   * Supprime un élément de l'inventaire de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} item - Élément à supprimer.
   * @returns {Promise<void>}
   */
  async removeInventoryItem(userId, item) {
    try {
      await UserRepository.removeItemFromInventory(userId, item);
      const user = await UserRepository.getCurrentUser(userId);
      await UserRepository.cacheCurrentUser(userId, user);
      logger.info(`Élément supprimé de l'inventaire de ${userId}`);
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'inventaire', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression de l\'inventaire');
    }
  }

  /**
   * Récupère l'inventaire de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<Array>} - Inventaire de l'utilisateur.
   */
  async getUserInventory(userId) {
    try {
      const inventory = await UserRepository.getUserInventory(userId);
      logger.info(`Inventaire de ${userId} récupéré`);
      return inventory;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'inventaire', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de l\'inventaire');
    }
  }

  /**
   * Met à jour les paramètres de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} settings - Paramètres à mettre à jour.
   * @returns {Promise<void>}
   */
  async updateUserSettings(userId, settings) {
    try {
      await UserRepository.updateUserSettings(userId, settings);
      const user = await UserRepository.getCurrentUser(userId);
      await UserRepository.cacheCurrentUser(userId, user);
      logger.info(`Paramètres de ${userId} mis à jour`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des paramètres', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour des paramètres');
    }
  }

  /**
   * Récupère les paramètres de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<Object>} - Paramètres de l'utilisateur.
   */
  async getUserSettings(userId) {
    try {
      const settings = await UserRepository.getUserSettings(userId);
      logger.info(`Paramètres de ${userId} récupérés`);
      return settings;
    } catch (error) {
      logger.error('Erreur lors de la récupération des paramètres', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des paramètres');
    }
  }

  /**
   * Supprime le compte de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      await UserRepository.clearUser(userId);
      await UserRepository.clearCurrentUserCache(userId);
      logger.info(`Utilisateur ${userId} supprimé`);
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'utilisateur', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression de l\'utilisateur');
    }
  }
}

module.exports = new UserService();
