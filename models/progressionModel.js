const Joi = require('joi');

/**
 * Schéma pour une mission dans la progression.
 * @typedef {Object} Mission
 * @property {string} id - ID de la mission.
 * @property {boolean} completed - Statut de complétion.
 */
const missionSchema = Joi.object({
  id: Joi.string().uuid().required(),
  completed: Joi.boolean().required()
});

/**
 * Schéma pour la progression dans Firestore et les réponses API.
 * @typedef {Object} Progression
 * @property {string} userId - ID de l'utilisateur.
 * @property {number} level - Niveau actuel (entier ≥ 1).
 * @property {number} xp - Points d'expérience (entier ≥ 0).
 * @property {string} [rank] - Rang (bronze, silver, gold).
 * @property {Array<Mission>} [missions] - Liste des missions.
 */
const progressionSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  level: Joi.number().integer().min(1).required(),
  xp: Joi.number().integer().min(0).required(),
  rank: Joi.string().valid('bronze', 'silver', 'gold').optional(),
  missions: Joi.array().items(missionSchema).optional()
});

/**
 * Valide les données de progression.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateProgression = (data) => progressionSchema.validate(data, { abortEarly: false });

/**
 * Convertit une progression Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Progression formatée.
 */
const fromFirestore = (doc) => ({
  userId: doc.userId,
  level: doc.level,
  xp: doc.xp,
  rank: doc.rank || null,
  missions: doc.missions || []
});

/**
 * Convertit une progression API en format Firestore.
 * @param {Object} progression - Progression API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (progression) => ({
  userId: progression.userId,
  level: progression.level,
  xp: progression.xp,
  rank: progression.rank,
  missions: progression.missions
});

module.exports = {
  progressionSchema,
  missionSchema,
  validateProgression,
  fromFirestore,
  toFirestore
};
