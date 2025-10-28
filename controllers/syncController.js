const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const SyncService = require('../services/syncService');

/**
 * Schéma pour la synchronisation des données utilisateur.
 * @typedef {Object} SyncData
 * @property {Object} localData - Données locales à synchroniser.
 * @property {string} [lastSyncTimestamp] - Dernier horodatage de synchronisation (ISO 8601).
 */

const syncDataSchema = Joi.object({
  localData: Joi.object().required(),
  lastSyncTimestamp: Joi.string().isoDate().optional(),
});

const syncListSchema = Joi.object({
  localItems: Joi.array().items(Joi.object()).optional(),
  localThreats: Joi.array().items(Joi.object()).optional(),
  localSignatures: Joi.array().items(Joi.object()).optional(),
  localSessions: Joi.array().items(Joi.object()).optional(),
  localNotifications: Joi.array().items(Joi.object()).optional(),
  localPathogens: Joi.array().items(Joi.object()).optional(),
  localResearches: Joi.array().items(Joi.object()).optional(),
  lastSyncTimestamp: Joi.string().isoDate().optional(),
});

class SyncController {
  async syncUserData(req, res, next) {
    try {
      const { userId } = req.user;
      const { localData, lastSyncTimestamp } = req.body;
      const delta = await SyncService.syncUserData(userId, localData, lastSyncTimestamp);
      res.status(200).json({ status: 'success', data: delta });
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des données utilisateur', { error });
      next(error);
    }
  }

  async syncInventory(req, res, next) {
    try {
      const { userId } = req.user;
      const { localItems, lastSyncTimestamp } = req.body;
      const delta = await SyncService.syncInventory(userId, localItems, lastSyncTimestamp);
      res.status(200).json({ status: 'success', data: delta });
    } catch (error) {
      logger.error('Erreur lors de la synchronisation de l\'inventaire', { error });
      next(error);
    }
  }

  async syncThreats(req, res, next) {
    try {
      const { userId } = req.user;
      const { localThreats, lastSyncTimestamp } = req.body;
      const delta = await SyncService.syncThreats(userId, localThreats, lastSyncTimestamp);
      res.status(200).json({ status: 'success', data: delta });
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des menaces', { error });
      next(error);
    }
  }

  async syncMemorySignatures(req, res, next) {
    try {
      const { userId } = req.user;
      const { localSignatures, lastSyncTimestamp } = req.body;
      const delta = await SyncService.syncMemorySignatures(userId, localSignatures, lastSyncTimestamp);
      res.status(200).json({ status: 'success', data: delta });
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des signatures mémoire', { error });
      next(error);
    }
  }

  async syncMultiplayerSessions(req, res, next) {
    try {
      const { userId } = req.user;
      const { localSessions, lastSyncTimestamp } = req.body;
      const delta = await SyncService.syncMultiplayerSessions(userId, localSessions, lastSyncTimestamp);
      res.status(200).json({ status: 'success', data: delta });
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des sessions multijoueurs', { error });
      next(error);
    }
  }

  async syncNotifications(req, res, next) {
    try {
      const { userId } = req.user;
      const { localNotifications, lastSyncTimestamp } = req.body;
      const delta = await SyncService.syncNotifications(userId, localNotifications, lastSyncTimestamp);
      res.status(200).json({ status: 'success', data: delta });
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des notifications', { error });
      next(error);
    }
  }

  async syncPathogens(req, res, next) {
    try {
      const { userId } = req.user;
      const { localPathogens, lastSyncTimestamp } = req.body;
      const delta = await SyncService.syncPathogens(userId, localPathogens, lastSyncTimestamp);
      res.status(200).json({ status: 'success', data: delta });
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des pathogènes', { error });
      next(error);
    }
  }

  async syncResearches(req, res, next) {
    try {
      const { userId } = req.user;
      const { localResearches, lastSyncTimestamp } = req.body;
      const delta = await SyncService.syncResearches(userId, localResearches, lastSyncTimestamp);
      res.status(200).json({ status: 'success', data: delta });
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des recherches', { error });
      next(error);
    }
  }
}

const controller = new SyncController();
module.exports = {
  syncUserData: [validate(syncDataSchema), controller.syncUserData.bind(controller)],
  syncInventory: [validate(syncListSchema), controller.syncInventory.bind(controller)],
  syncThreats: [validate(syncListSchema), controller.syncThreats.bind(controller)],
  syncMemorySignatures: [validate(syncListSchema), controller.syncMemorySignatures.bind(controller)],
  syncMultiplayerSessions: [validate(syncListSchema), controller.syncMultiplayerSessions.bind(controller)],
  syncNotifications: [validate(syncListSchema), controller.syncNotifications.bind(controller)],
  syncPathogens: [validate(syncListSchema), controller.syncPathogens.bind(controller)],
  syncResearches: [validate(syncListSchema), controller.syncResearches.bind(controller)],
  syncDataSchema,
  syncListSchema,
};
