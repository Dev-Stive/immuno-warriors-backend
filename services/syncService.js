const { AppError } = require('../utils/errorUtils');
const  logger  = require('../utils/logger');
const SyncRepository = require('../repositories/syncRepository');


class SyncService {
  async syncUserData(userId, localData, lastSyncTimestamp) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      if (!localData) throw new AppError(400, 'Données locales manquantes');
      const delta = await SyncRepository.synchronizeUserData(userId, localData, lastSyncTimestamp);
      logger.info(`Données utilisateur ${userId} synchronisées`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des données utilisateur', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la synchronisation des données utilisateur');
    }
  }

  async syncInventory(userId, localItems, lastSyncTimestamp) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      if (!Array.isArray(localItems)) throw new AppError(400, 'Items locaux doivent être une liste');
      const delta = await SyncRepository.synchronizeInventory(userId, localItems, lastSyncTimestamp);
      logger.info(`Inventaire de l'utilisateur ${userId} synchronisé`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation de l\'inventaire', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la synchronisation de l\'inventaire');
    }
  }

  async syncThreats(userId, localThreats, lastSyncTimestamp) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      if (!Array.isArray(localThreats)) throw new AppError(400, 'Menaces locales doivent être une liste');
      const delta = await SyncRepository.synchronizeThreats(userId, localThreats, lastSyncTimestamp);
      logger.info(`Menaces synchronisées pour l'utilisateur ${userId}`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des menaces', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la synchronisation des menaces');
    }
  }

  async syncMemorySignatures(userId, localSignatures, lastSyncTimestamp) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      if (!Array.isArray(localSignatures)) throw new AppError(400, 'Signatures locales doivent être une liste');
      const delta = await SyncRepository.synchronizeMemorySignatures(userId, localSignatures, lastSyncTimestamp);
      logger.info(`Signatures mémoire de l'utilisateur ${userId} synchronisées`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des signatures mémoire', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la synchronisation des signatures mémoire');
    }
  }

  async syncMultiplayerSessions(userId, localSessions, lastSyncTimestamp) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      if (!Array.isArray(localSessions)) throw new AppError(400, 'Sessions locales doivent être une liste');
      const delta = await SyncRepository.synchronizeMultiplayerSessions(userId, localSessions, lastSyncTimestamp);
      logger.info(`Sessions multijoueurs de l'utilisateur ${userId} synchronisées`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des sessions multijoueurs', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la synchronisation des sessions multijoueurs');
    }
  }

  async syncNotifications(userId, localNotifications, lastSyncTimestamp) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      if (!Array.isArray(localNotifications)) throw new AppError(400, 'Notifications locales doivent être une liste');
      const delta = await SyncRepository.synchronizeNotifications(userId, localNotifications, lastSyncTimestamp);
      logger.info(`Notifications de l'utilisateur ${userId} synchronisées`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des notifications', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la synchronisation des notifications');
    }
  }

  async syncPathogens(userId, localPathogens, lastSyncTimestamp) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      if (!Array.isArray(localPathogens)) throw new AppError(400, 'Pathogènes locaux doivent être une liste');
      const delta = await SyncRepository.synchronizePathogens(userId, localPathogens, lastSyncTimestamp);
      logger.info(`Pathogènes synchronisés pour l'utilisateur ${userId}`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des pathogènes', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la synchronisation des pathogènes');
    }
  }

  async syncResearches(userId, localResearches, lastSyncTimestamp) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      if (!Array.isArray(localResearches)) throw new AppError(400, 'Recherches locales doivent être une liste');
      const delta = await SyncRepository.synchronizeResearches(userId, localResearches, lastSyncTimestamp);
      logger.info(`Recherches de l'utilisateur ${userId} synchronisées`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des recherches', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la synchronisation des recherches');
    }
  }
}

module.exports = new SyncService();
