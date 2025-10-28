const Joi = require('joi');

/**
 * Schéma pour l'utilisateur dans Firestore et les réponses API.
 * @typedef {Object} User
 * @property {string} id - Identifiant unique de l'utilisateur.
 * @property {string} email - Adresse e-mail de l'utilisateur.
 * @property {string} [username] - Nom d'utilisateur (optionnel).
 * @property {string} [avatar] - URL de l'avatar (optionnel).
 * @property {string} [createdAt] - Date de création (ISO 8601).
 * @property {string} [lastLogin] - Date de dernière connexion (ISO 8601).
 * @property {Object} [resources] - Ressources de l'utilisateur (ex. { energy: 100 }).
 * @property {Object} [progression] - Progression (ex. { level: 1, xp: 500 }).
 * @property {Object} [achievements] - Succès (ex. { firstCombat: true }).
 * @property {Array} [inventory] - Inventaire (liste d'objets).
 */
const userSchema = Joi.object({
  id: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  username: Joi.string().optional(),
  avatar: Joi.string().uri().optional(),
  createdAt: Joi.string().isoDate().optional(),
  lastLogin: Joi.string().isoDate().optional(),
  resources: Joi.object().pattern(Joi.string(), Joi.number()).optional(),
  progression: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  achievements: Joi.object().pattern(Joi.string(), Joi.boolean()).optional(),
  inventory: Joi.array().items(Joi.any()).optional()
});

/**
 * Valide les données utilisateur.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateUser = (data) => userSchema.validate(data, { abortEarly: false });

/**
 * Convertit un utilisateur Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Utilisateur formaté.
 */
const fromFirestore = (doc) => ({
  id: doc.id,
  email: doc.email,
  username: doc.username || null,
  avatar: doc.avatar || null,
  createdAt: doc.createdAt || null,
  lastLogin: doc.lastLogin || null,
  resources: doc.resources || { energy: 0 },
  progression: doc.progression || { level: 1, xp: 0 },
  achievements: doc.achievements || {},
  inventory: doc.inventory || []
});

/**
 * Convertit un utilisateur API en format Firestore.
 * @param {Object} user - Utilisateur API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  avatar: user.avatar,
  createdAt: user.createdAt,
  lastLogin: user.lastLogin,
  resources: user.resources,
  progression: user.progression,
  achievements: user.achievements,
  inventory: user.inventory
});

module.exports = {
  userSchema,
  validateUser,
  fromFirestore,
  toFirestore
};
