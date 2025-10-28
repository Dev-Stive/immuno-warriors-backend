const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const UserService = require('../services/userService');

const updateProfileSchema = Joi.object({
  username: Joi.string().min(3).max(30).optional(),
  avatar: Joi.string().uri().optional(),
});

const addResourcesSchema = Joi.object({
  credits: Joi.number().integer().min(0).optional(),
  energy: Joi.number().integer().min(0).optional(),
});

const addInventoryItemSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().required(),
  name: Joi.string().required(),
  quantity: Joi.number().integer().min(1).default(1),
});

const updateSettingsSchema = Joi.object({
  notifications: Joi.boolean().optional(),
  sound: Joi.boolean().optional(),
  language: Joi.string().optional(),
});

class UserController {
  /**
   * Récupère le profil de l'utilisateur connecté.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON avec le profil.
   */
  async getProfile(req, res) {
    const { userId } = req.user;
    try {
      const profile = await UserService.getUserProfile(userId);
      res.status(200).json(profile);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Met à jour le profil de l'utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON confirmant la mise à jour.
   */
  async updateProfile(req, res) {
    const { userId } = req.user;
    const profile = req.body;
    try {
      await UserService.updateUserProfile(userId, profile);
      res.status(200).json({ message: 'Profil mis à jour' });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ajoute des ressources à l'utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON confirmant l'ajout.
   */
  async addResources(req, res) {
    const { userId } = req.user;
    const resources = req.body;
    try {
      await UserService.addResources(userId, resources);
      res.status(200).json({ message: 'Ressources ajoutées' });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les ressources de l'utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON avec les ressources.
   */
  async getResources(req, res) {
    const { userId } = req.user;
    try {
      const resources = await UserService.getUserResources(userId);
      res.status(200).json(resources);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ajoute un élément à l'inventaire de l'utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON confirmant l'ajout.
   */
  async addInventoryItem(req, res) {
    const { userId } = req.user;
    const item = req.body;
    try {
      await UserService.addInventoryItem(userId, item);
      res.status(200).json({ message: 'Élément ajouté à l\'inventaire' });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime un élément de l'inventaire de l'utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON confirmant la suppression.
   */
  async removeInventoryItem(req, res) {
    const { userId } = req.user;
    const { itemId } = req.params;
    try {
      const item = (await UserService.getUserInventory(userId)).find(i => i.id === itemId);
      if (!item) throw new NotFoundError('Élément non trouvé dans l\'inventaire');
      await UserService.removeInventoryItem(userId, item);
      res.status(200).json({ message: 'Élément supprimé de l\'inventaire' });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère l'inventaire de l'utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON avec l'inventaire.
   */
  async getInventory(req, res) {
    const { userId } = req.user;
    try {
      const inventory = await UserService.getUserInventory(userId);
      res.status(200).json(inventory);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Met à jour les paramètres de l'utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON confirmant la mise à jour.
   */
  async updateSettings(req, res) {
    const { userId } = req.user;
    const settings = req.body;
    try {
      await UserService.updateUserSettings(userId, settings);
      res.status(200).json({ message: 'Paramètres mis à jour' });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les paramètres de l'utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON avec les paramètres.
   */
  async getSettings(req, res) {
    const { userId } = req.user;
    try {
      const settings = await UserService.getUserSettings(userId);
      res.status(200).json(settings);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime le compte de l'utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON confirmant la suppression.
   */
  async deleteUser(req, res) {
    const { userId } = req.user;
    try {
      await UserService.deleteUser(userId);
      res.status(200).json({ message: 'Utilisateur supprimé' });
    } catch (error) {
      throw error;
    }
  }
}

const controller = new UserController();
module.exports = {
  getProfile: controller.getProfile.bind(controller),
  updateProfile: [validate(updateProfileSchema), controller.updateProfile.bind(controller)],
  addResources: [validate(addResourcesSchema), controller.addResources.bind(controller)],
  getResources: controller.getResources.bind(controller),
  addInventoryItem: [validate(addInventoryItemSchema), controller.addInventoryItem.bind(controller)],
  removeInventoryItem: controller.removeInventoryItem.bind(controller),
  getInventory: controller.getInventory.bind(controller),
  updateSettings: [validate(updateSettingsSchema), controller.updateSettings.bind(controller)],
  getSettings: controller.getSettings.bind(controller),
  deleteUser: controller.deleteUser.bind(controller),
};