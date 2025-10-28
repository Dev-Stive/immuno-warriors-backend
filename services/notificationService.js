const { v4: uuidv4 } = require('uuid');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const NotificationRepository = require('../repositories/notificationRepository');
const UserRepository = require('../repositories/userRepository');
const { formatTimestamp } = require('../utils/dateUtils');

class NotificationService {
  async createNotification(userId, notificationData) {
    try {
      if (!userId || !notificationData) throw new AppError(400, 'Données invalides');
      const user = await UserRepository.getCurrentUserId(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const notificationId = uuidv4();
      const notification = {
        id: notificationId,
        userId,
        message: notificationData.message,
        type: notificationData.type || 'system',
        isRead: false,
        timestamp: formatTimestamp(),
      };
      await NotificationRepository.createNotification(notification);
      await NotificationRepository.cacheNotification(notificationId, notification);
      logger.info(`Notification ${notificationId} créée pour l'utilisateur ${userId}`);
      return notification;
    } catch (error) {
      logger.error('Erreur lors de la création de la notification', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création de la notification');
    }
  }

  async getNotifications(userId, page = 1, limit = 10) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const notifications = await NotificationRepository.getNotifications(userId, page, limit);
      logger.info(`Notifications récupérées pour l'utilisateur ${userId}, page ${page}, limite ${limit}`);
      return notifications;
    } catch (error) {
      logger.error('Erreur lors de la récupération des notifications', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des notifications');
    }
  }

  async markAsRead(notificationId) {
    try {
      if (!notificationId) throw new AppError(400, 'ID de notification invalide');
      const notification = await NotificationRepository.getNotification(notificationId);
      if (!notification) throw new NotFoundError('Notification non trouvée');

      await NotificationRepository.markNotificationAsRead(notificationId);
      logger.info(`Notification ${notificationId} marquée comme lue`);
    } catch (error) {
      logger.error('Erreur lors du marquage de la notification comme lue', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors du marquage');
    }
  }

  async deleteNotification(notificationId) {
    try {
      if (!notificationId) throw new AppError(400, 'ID de notification invalide');
      const notification = await NotificationRepository.getNotification(notificationId);
      if (!notification) throw new NotFoundError('Notification non trouvée');

      await NotificationRepository.deleteNotification(notificationId);
      logger.info(`Notification ${notificationId} supprimée`);
    } catch (error) {
      logger.error('Erreur lors de la suppression de la notification', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression');
    }
  }

  async markBatchNotificationsAsRead(userId, notificationIds) {
    try {
      if (!userId || !notificationIds || !notificationIds.length) throw new AppError(400, 'Données invalides');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      await NotificationRepository.markBatchNotificationsAsRead(notificationIds);
      logger.info(`${notificationIds.length} notifications marquées comme lues pour ${userId}`);
    } catch (error) {
      logger.error('Erreur lors du marquage du lot de notifications', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors du marquage du lot');
    }
  }

  async deleteBatchNotifications(userId, notificationIds) {
    try {
      if (!userId || !notificationIds || !notificationIds.length) throw new AppError(400, 'Données invalides');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      await NotificationRepository.deleteBatchNotifications(notificationIds);
      logger.info(`${notificationIds.length} notifications supprimées pour ${userId}`);
    } catch (error) {
      logger.error('Erreur lors de la suppression du lot de notifications', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du lot');
    }
  }
}

module.exports = new NotificationService();
