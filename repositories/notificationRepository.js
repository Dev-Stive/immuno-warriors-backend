const { db } = require('../services/firebaseService');
const { v4: uuidv4 } = require('uuid');
const { validateNotification, fromFirestore, toFirestore } = require('../models/notificationModel');
const { AppError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');

class NotificationRepository {
  constructor() {
    this.collection = db.collection('notifications');
    this.cacheCollection = db.collection('notificationCache');
  }

  async getNotifications(userId, page = 1, limit = 10) {
    try {
      const snapshot = await this.collection
        .where('userId', '==', userId)
        .where('deleted', '==', false)
        .orderBy('timestamp', 'desc')
        .offset((page - 1) * limit)
        .limit(limit)
        .get();
      return snapshot.docs.map(doc => fromFirestore(doc.data()));
    } catch (error) {
      logger.error('Erreur lors de la récupération des notifications', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des notifications');
    }
  }

  async createNotification(notification) {
    const validation = validateNotification(notification);
    if (validation.error) {
      throw new AppError(400, 'Données de notification invalides', validation.error.details);
    }
    const notificationId = notification.id || uuidv4();
    try {
      const data = toFirestore({
        ...notification,
        id: notificationId,
        timestamp: formatTimestamp(),
        createdAt: formatTimestamp(),
        updatedAt: formatTimestamp(),
        deleted: false,
      });
      await this.collection.doc(notificationId).set(data);
      await this.cacheNotification(notificationId, data);
      logger.info(`Notification ${notificationId} créée`);
      return notificationId;
    } catch (error) {
      logger.error('Erreur lors de la création de la notification', { error });
      throw new AppError(500, 'Erreur serveur lors de la création de la notification');
    }
  }

  async deleteNotification(notificationId) {
    try {
      await this.collection.doc(notificationId).update({
        deleted: true,
        updatedAt: formatTimestamp(),
      });
      await this.cacheCollection.doc(notificationId).delete();
      logger.info(`Notification ${notificationId} marquée comme supprimée`);
    } catch (error) {
      logger.error('Erreur lors de la suppression de la notification', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression de la notification');
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      await this.collection.doc(notificationId).update({
        isRead: true,
        readAt: formatTimestamp(),
        updatedAt: formatTimestamp(),
      });
      const notification = await this.getNotification(notificationId);
      await this.cacheNotification(notificationId, notification);
      logger.info(`Notification ${notificationId} marquée comme lue`);
    } catch (error) {
      logger.error('Erreur lors du marquage de la notification comme lue', { error });
      throw new AppError(500, 'Erreur serveur lors du marquage de la notification comme lue');
    }
  }

  async getNotification(id){
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) return null;
      const notification = fromFirestore(doc.data());
      if (notification.deletedAt) return null;
      return notification;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la notification', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération de la notification');
    }
  }

  async getNotificationsByType(userId, type, page = 1, limit = 10) {
    try {
      const snapshot = await this.collection
        .where('userId', '==', userId)
        .where('type', '==', type)
        .where('deleted', '==', false)
        .orderBy('timestamp', 'desc')
        .offset((page - 1) * limit)
        .limit(limit)
        .get();
      return snapshot.docs.map(doc => fromFirestore(doc.data()));
    } catch (error) {
      logger.error('Erreur lors de la récupération des notifications par type', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des notifications par type');
    }
  }

  async markBatchNotificationsAsRead(notificationIds) {
    try {
      const batch = db.batch();
      for (const id of notificationIds) {
        const docRef = this.collection.doc(id);
        batch.update(docRef, {
          isRead: true,
          readAt: formatTimestamp(),
          updatedAt: formatTimestamp(),
        });
      }
      await batch.commit();
      for (const id of notificationIds) {
        const notification = await this.getNotification(id);
        await this.cacheNotification(id, notification);
      }
      logger.info(`${notificationIds.length} notifications marquées comme lues`);
    } catch (error) {
      logger.error('Erreur lors du marquage du lot de notifications', { error });
      throw new AppError(500, 'Erreur serveur lors du marquage du lot de notifications');
    }
  }

  async deleteBatchNotifications(notificationIds) {
    try {
      const batch = db.batch();
      for (const id of notificationIds) {
        const docRef = this.collection.doc(id);
        batch.update(docRef, {
          deleted: true,
          updatedAt: formatTimestamp(),
        });
        batch.delete(this.cacheCollection.doc(id));
      }
      await batch.commit();
      logger.info(`${notificationIds.length} notifications marquées comme supprimées`);
    } catch (error) {
      logger.error('Erreur lors de la suppression du lot de notifications', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression du lot de notifications');
    }
  }

  async cacheNotification(notificationId, notificationData) {
    try {
      if (notificationData) {
        await this.cacheCollection.doc(notificationId).set({
          ...toFirestore(notificationData),
          cachedAt: formatTimestamp(),
        });
        logger.info(`Notification ${notificationId} mise en cache`);
      } else {
        await this.cacheCollection.doc(notificationId).delete();
        logger.info(`Cache de la notification ${notificationId} supprimé`);
      }
    } catch (error) {
      logger.error('Erreur lors de la mise en cache de la notification', { error });
      throw new AppError(500, 'Erreur serveur lors de la mise en cache de la notification');
    }
  }

  async getCachedNotifications(userId) {
    try {
      const snapshot = await this.cacheCollection
        .where('userId', '==', userId)
        .where('deleted', '==', false)
        .get();
      return snapshot.docs.map(doc => fromFirestore(doc.data()));
    } catch (error) {
      logger.error('Erreur lors de la récupération des notifications en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des notifications en cache');
    }
  }

  async clearCachedNotifications() {
    try {
      const snapshot = await this.cacheCollection.get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      logger.info('Toutes les notifications en cache ont été supprimées');
    } catch (error) {
      logger.error('Erreur lors de la suppression des notifications en cache', { error });
      throw new AppError(500, 'Erreur serveur lors de la suppression des notifications en cache');
    }
  }
}

module.exports = new NotificationRepository();

