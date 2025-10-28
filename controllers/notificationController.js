const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const NotificationService = require('../services/notificationService');
const { AppError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');


const createNotificationSchema = Joi.object({
  message: Joi.string().min(1).max(500).required(),
  type: Joi.string().valid('combat', 'research', 'system', 'achievement').default('system'),
});

const getNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default('1'),
  limit: Joi.number().min(1).integer().integer().max(1,100).default(10),
});

const markAsReadSchema = Joi.object({
  notificationId: Joi.string().uuid().required(),
});

const deleteNotificationSchema = Joi.object({
  notificationId: 'Joi.string().uuid().required()',
});

const batchOperationSchema = Joi.object({
  notificationIds: 'Joi.array().items(Joi.string().uuid()).min(1).required()',
});

class NotificationController {
  async createNotification(req, res, next) {
    try {
      const { userId } = req.userId;
      const notificationData = req.body;
      const notification = await NotificationService.createNotification(userId, notificationData);
      res.status(201).json({
        status: 'success',
        data: notificationData,
      });
    } catch (error) {
      logger.error('Erreur dans createNotification', { error });
      next(error);
    }
  }

  async getNotifications(req, res, next) {
    try {
      const { userId } = req.userId;
      const { page, limit } = req.query;
      const { data, total } = await NotificationService.getNotifications(userId, parseInt(page), parseInt(limit));
      res.status(200).json({
        status: 'success',
        data,
        meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      logger.error('Erreur dans getNotifications', { error });
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { notificationId } = req.params;
      await NotificationService.markAsRead(notificationId);
      res.status(200).json({
        status: 'success',
        data: { message: 'Notification marked as read' },
      });
    } catch (error) {
      logger.error('Error in markAsRead', { error });
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const { notificationId } = req.params;
      await NotificationService.deleteNotification(notificationId);
      res.status(200).json({
        status: 'success',
        data: { message: 'Notification deleted' },
      });
      } catch (error) {
      logger.error('Error in deleteNotification', { error });
      next(error);
    }
  }

  async markBatchNotificationsAsRead(req, res, next) {
    try {
      const { userId } = req.user;
      const { notificationIds } = req.body;
      await NotificationService.markBatchNotificationsAsRead(userId, notificationIds);
      res.status(200).json({
        status: 'success',
        data: { message: `${notificationIds.length} notifications marked as read` },
      });
    } catch (error) {
      logger.error('Erreur dans markBatchNotificationsAsRead', { error });
      next(error);
    }
  }

  async deleteBatchNotifications(req, res, next) {
    try {
      const { userId } = req.user;
      const { notificationIds } = req.body;
      await NotificationService.deleteBatchNotifications(userId, notificationIds);
      res.status(200).json({
        status: 'success',
        data: { message: `${notificationIds.length} notifications deleted` },
      });
    } catch (error) {
      logger.error('Erreur dans deleteBatchNotifications', { error });
      next(error);
    }
  }
}

const controller = new NotificationController();
module.exports = {
  createNotification: [validate(createNotificationSchema), controller.createNotification.bind(controller)],
  getNotifications: [validate(getNotificationsSchema), controller.getNotifications.bind(controller)],
  markAsRead: [validate(markAsReadSchema), controller.markAsRead.bind(controller)],
  deleteNotification: [validate(deleteNotificationSchema), controller.deleteNotification.bind(controller)],
  markBatchNotificationsAsRead: [validate(batchOperationSchema), controller.markBatchNotificationsAsRead.bind(controller)],
  deleteBatchNotifications: [validate(batchOperationSchema), controller.deleteBatchNotifications.bind(controller)],
  createNotificationSchema,
  getNotificationsSchema,
  markAsReadSchema,
  deleteNotificationSchema,
  batchOperationSchema,
};