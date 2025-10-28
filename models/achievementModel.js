const Joi = require('joi');

/**
 * Schéma pour un succès dans Firestore et les réponses API.
 * @typedef {Object} Achievement
 * @property {string} id - Identifiant unique.
 * @property {string} name - Nom du succès.
 * @property {string} description - Description.
 * @property {boolean} unlocked - État de déverrouillage.
 * @property {string} [unlockedAt] - Date de déverrouillage (ISO 8601).
 */
const achievementSchema = Joi.object({
  id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  unlocked: Joi.boolean().required(),
  unlockedAt: Joi.string().isoDate().optional()
});

/**
 * Valide les données du succès.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateAchievement = (data) => achievementSchema.validate(data, { abortEarly: false });

/**
 * Convertit un succès Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Succès formaté.
 */
const fromFirestore = (doc) => ({
  id: doc.id,
  name: doc.name,
  description: doc.description,
  unlocked: doc.unlocked,
  unlockedAt: doc.unlockedAt || null
});

/**
 * Convertit un succès API en format Firestore.
 * @param {Object} achievement - Succès API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (achievement) => ({
  id: achievement.id,
  name: achievement.name,
  description: achievement.description,
  unlocked: achievement.unlocked,
  unlockedAt: achievement.unlockedAt
});

module.exports = {
  achievementSchema,
  validateAchievement,
  fromFirestore,
  toFirestore
};
