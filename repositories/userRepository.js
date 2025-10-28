const { db, auth } = require('../services/firebaseService');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const logger = require('../utils/logger');

class UserRepository {
  constructor() {
    this.collection = db.collection('users');
    this.cacheCollection = db.collection('userCache');
  }

  /**
   * Sauvegarde ou met à jour un utilisateur dans Firestore.
   * @param {Object} user - Données de l'utilisateur.
   * @returns {Promise<void>}
   */
  async saveUser(user) {
    try {
      await this.collection.doc(user.id).set(user);
      logger.info(`Utilisateur ${user.id} sauvegardé`);
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde de l\'utilisateur', { error });
      throw new AppError(500, 'Erreur serveur lors de la sauvegarde de l\'utilisateur');
    }
  }

  /**
   * Récupère l'utilisateur actuel par ID.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<Object|null>} - Utilisateur ou null.
   */
  async getCurrentUser(userId) {
    try {
      const doc = await this.collection.doc(userId).get();
      if (!doc.exists) return null;
      return doc.data();
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'utilisateur', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de l\'utilisateur');
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
      await this.collection.doc(userId).update(profile);
      logger.info(`Profil de l'utilisateur ${userId} mis à jour`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour du profil');
    }
  }

  /**
   * Récupère les ressources de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<Object>} - Ressources.
   */
  async getUserResources(userId) {
    const user = await this.getCurrentUser(userId);
    if (!user) throw new NotFoundError('Utilisateur non trouvé');
    return user.resources || {};
  }

  /**
   * Met à jour les ressources de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} resources - Nouvelles ressources.
   * @returns {Promise<void>}
   */
  async updateUserResources(userId, resources) {
    try {
      await this.collection.doc(userId).update({ resources });
      logger.info(`Ressources de l'utilisateur ${userId} mises à jour`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des ressources', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour des ressources');
    }
  }

  /**
   * Ajoute un élément à l'inventaire.
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} item - Élément à ajouter.
   * @returns {Promise<void>}
   */
  async addItemToInventory(userId, item) {
    try {
      await this.collection.doc(userId).update({
        inventory: db.FieldValue.arrayUnion(item),
      });
      logger.info(`Élément ajouté à l'inventaire de ${userId}`);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout à l\'inventaire', { error });
      throw new AppError(500, 'Erreur serveur lors de l\'ajout à l\'inventaire');
    }
  }

  /**
   * Supprime un élément de l'inventaire.
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} item - Élément à supprimer.
   * @returns {Promise<void>}
   */
  async removeItemFromInventory(userId, item) {
    try {
      await this.collection.doc(userId).update({
        inventory: db.FieldValue.arrayRemove(item),
      });
      logger.info(`Élément supprimé de l'inventaire de ${userId}`);
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'inventaire', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression de l\'inventaire');
    }
  }

  /**
   * Récupère l'inventaire de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<Array>} - Inventaire.
   */
  async getUserInventory(userId) {
    const user = await this.getCurrentUser(userId);
    if (!user) throw new NotFoundError('Utilisateur non trouvé');
    return user.inventory || [];
  }

  /**
   * Met à jour les paramètres de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} settings - Nouveaux paramètres.
   * @returns {Promise<void>}
   */
  async updateUserSettings(userId, settings) {
    try {
      await this.collection.doc(userId).update({ settings });
      logger.info(`Paramètres de l'utilisateur ${userId} mis à jour`);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des paramètres', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour des paramètres');
    }
  }

  /**
   * Récupère les paramètres de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<Object>} - Paramètres.
   */
  async getUserSettings(userId) {
    const user = await this.getCurrentUser(userId);
    if (!user) throw new NotFoundError('Utilisateur non trouvé');
    return user.settings || {};
  }

  /**
   * Supprime un utilisateur de Firestore et Firebase Auth.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<void>}
   */
  async clearUser(userId) {
    try {
      await this.collection.doc(userId).delete();
      await auth.deleteUser(userId);
      logger.info(`Utilisateur ${userId} supprimé`);
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'utilisateur', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression de l\'utilisateur');
    }
  }

  /**
   * Met en cache les données de l'utilisateur actuel.
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} userData - Données de l'utilisateur.
   * @returns {Promise<void>}
   */
  async cacheCurrentUser(userId, userData) {
    try {
      await this.cacheCollection.doc(userId).set({
        ...userData,
        cachedAt: new Date().toISOString(),
      });
      logger.info(`Utilisateur ${userId} mis en cache`);
    } catch (error) {
      logger.error('Erreur lors de la mise en cache de l\'utilisateur', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise en cache de l\'utilisateur');
    }
  }

  /**
   * Supprime les données de la session en cache.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<void>}
   */
  async clearCachedSession(userId) {
    try {
      await this.cacheCollection.doc(userId).delete();
      logger.info(`Session de l'utilisateur ${userId} supprimée du cache`);
    } catch (error) {
      logger.error('Erreur lors de la suppression du cache de la session', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression du cache de la session');
    }
  }

  /**
   * Vérifie si une session est valide.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<boolean>} - True si valide.
   */
  async isSessionValid(userId) {
    try {
      const doc = await this.cacheCollection.doc(userId).get();
      return doc.exists;
    } catch (error) {
      logger.error('Erreur lors de la vérification de la session', { error });
      throw new AppError(500, 'Erreur serveur lors de la vérification de la session');
    }
  }

  /**
   * Supprime les données de l'utilisateur du cache.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<void>}
   */
  async clearCurrentUserCache(userId) {
    try {
      await this.cacheCollection.doc(userId).delete();
      logger.info(`Cache de l'utilisateur ${userId} supprimé`);
    } catch (error) {
      logger.error('Erreur lors de la suppression du cache utilisateur', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression du cache utilisateur');
    }
  }
}

module.exports = new UserRepository();
