const Joi = require('joi');

/**
 * Schéma pour une recherche dans Firestore et les réponses API.
 * @typedef {Object} Research
 * @property {string} id - Identifiant unique.
 * @property {string} name - Nom de la recherche.
 * @property {string} description - Description.
 * @property {number} researchCost - Coût en ressources.
 * @property {string[]} prerequisites - IDs des prérequis.
 * @property {Object} effects - Effets (ex. { attackBoost: 10 }).
 * @property {number} level - Niveau de la recherche.
 * @property {boolean} isUnlocked - État de déverrouillage.
 */
const researchSchema = Joi.object({
  id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  researchCost: Joi.number().integer().min(0).required(),
  prerequisites: Joi.array().items(Joi.string().uuid()).required(),
  effects: Joi.object().pattern(Joi.string(), Joi.any()).required(),
  level: Joi.number().integer().min(0).required(),
  isUnlocked: Joi.boolean().default(false)
});

/**
 * Valide les données de recherche.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateResearch = (data) => researchSchema.validate(data, { abortEarly: false });

/**
 * Convertit une recherche Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Recherche formatée.
 */
const fromFirestore = (doc) => ({
  id: doc.id,
  name: doc.name,
  description: doc.description,
  researchCost: doc.researchCost,
  prerequisites: doc.prerequisites || [],
  effects: doc.effects || {},
  level: doc.level,
  isUnlocked: doc.isUnlocked || false
});

/**
 * Convertit une recherche API en format Firestore.
 * @param {Object} research - Recherche API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (research) => ({
  id: research.id,
  name: research.name,
  description: research.description,
  researchCost: research.researchCost,
  prerequisites: research.prerequisites,
  effects: research.effects,
  level: research.level,
  isUnlocked: research.isUnlocked
});

module.exports = {
  researchSchema,
  validateResearch,
  fromFirestore,
  toFirestore
};
