const Joi = require('joi');

/**
 * Schéma pour une cible de menace dans Firestore et les réponses API.
 * @typedef {Object} Threat
 * @property {string} id - Identifiant unique.
 * @property {string} name - Nom de la menace.
 * @property {string} type - Type (ex. pathogen, base).
 * @property {number} threatLevel - Niveau de menace (1 à 100).
 * @property {Object} [details] - Détails supplémentaires.
 */
const threatSchema = Joi.object({
  id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  type: Joi.string().required(),
  threatLevel: Joi.number().integer().min(1).max(100).required(),
  details: Joi.object().optional()
});

/**
 * Valide les données de la menace.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateThreat = (data) => threatSchema.validate(data, { abortEarly: false });

/**
 * Convertit une menace Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Menace formatée.
 */
const fromFirestore = (doc) => ({
  id: doc.id,
  name: doc.name,
  type: doc.type,
  threatLevel: doc.threatLevel,
  details: doc.details || {}
});

/**
 * Convertit une menace API en format Firestore.
 * @param {Object} threat - Menace API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (threat) => ({
  id: threat.id,
  name: threat.name,
  type: threat.type,
  threatLevel: threat.threatLevel,
  details: threat.details
});

module.exports = {
  threatSchema,
  validateThreat,
  fromFirestore,
  toFirestore
};
