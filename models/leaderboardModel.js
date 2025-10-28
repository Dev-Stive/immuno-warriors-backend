const Joi = require('joi');

/**
 * Schéma pour une entrée de classement dans Firestore et les réponses API.
 * @typedef {Object} LeaderboardEntry
 * @property {string} userId - ID de l'utilisateur.
 * @property {string} username - Nom d'utilisateur.
 * @property {number} score - Score total.
 * @property {number} rank - Rang actuel.
 * @property {string} [updatedAt] - Date de mise à jour (ISO 8601).
 */
const leaderboardSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  username: Joi.string().required(),
  score: Joi.number().integer().min(0).required(),
  rank: Joi.number().integer().min(1).required(),
  updatedAt: Joi.string().isoDate().optional()
});

/**
 * Valide les données du classement.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateLeaderboardEntry = (data) => leaderboardSchema.validate(data, { abortEarly: false });

/**
 * Convertit une entrée Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Entrée formatée.
 */
const fromFirestore = (doc) => ({
  userId: doc.userId,
  username: doc.username,
  score: doc.score,
  rank: doc.rank,
  updatedAt: doc.updatedAt || null
});

/**
 * Convertit une entrée API en format Firestore.
 * @param {Object} entry - Entrée API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (entry) => ({
  userId: entry.userId,
  username: entry.username,
  score: entry.score,
  rank: entry.rank,
  updatedAt: entry.updatedAt
});

module.exports = {
  leaderboardSchema,
  validateLeaderboardEntry,
  fromFirestore,
  toFirestore
};
