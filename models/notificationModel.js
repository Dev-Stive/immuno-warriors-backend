const Joi = require('joi');

/**
 * Schéma pour une notification dans Firestore et les réponses API.
 * @typedef {Object} Notification
 * @property {string} id - Identifiant unique.
 * @property {string} userId - ID de l'utilisateur.
 * @property {string} message - Message de la notification.
 * @property {string} timestamp - Date/heure (ISO 8601).
 * @property {boolean} isRead - État de lecture.
 * @property {string} type - Type (combat, research, system, achievement).
 */
const notificationSchema = Joi.object({
  id: Joi.string().uuid().required(),
  userId: Joi.string().uuid().required(),
  message: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  isRead: Joi.boolean().default(false),
  type: Joi.string().valid('combat', 'research', 'system', 'achievement').default('system')
});

/**
 * Valide les données de la notification.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateNotification = (data) => notificationSchema.validate(data, { abortEarly: false });

/**
 * Convertit une notification Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Notification formatée.
 */
const fromFirestore = (doc) => ({
  id: doc.id,
  userId: doc.userId,
  message: doc.message,
  timestamp: doc.timestamp,
  isRead: doc.isRead || false,
  type: doc.type || 'system'
});

/**
 * Convertit une notification API en format Firestore.
 * @param {Object} notification - Notification API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (notification) => ({
  id: notification.id,
  userId: notification.userId,
  message: notification.message,
  timestamp: notification.timestamp,
  isRead: notification.isRead,
  type: notification.type
});

module.exports = {
  notificationSchema,
  validateNotification,
  fromFirestore,
  toFirestore
};
