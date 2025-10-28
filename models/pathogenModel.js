const Joi = require('joi');

/**
 * Schéma pour un pathogène dans Firestore et les réponses API.
 * @typedef {Object} Pathogen
 * @property {string} id - Identifiant unique.
 * @property {string} type - Type (virus, bacteria, fungus).
 * @property {string} name - Nom du pathogène.
 * @property {number} health - Points de vie.
 * @property {number} attack - Points d'attaque.
 * @property {string} attackType - Type d'attaque (physical, chemical, energy).
 * @property {string} resistanceType - Type de résistance (physical, chemical, energy).
 * @property {string} rarity - Rareté (common, uncommon, rare, epic, legendary).
 * @property {number} mutationRate - Taux de mutation (0 à 1).
 * @property {string[]} [abilities] - Capacités spéciales.
 */
const pathogenSchema = Joi.object({
  id: Joi.string().uuid().required(),
  type: Joi.string().valid('virus', 'bacteria', 'fungus').required(),
  name: Joi.string().required(),
  health: Joi.number().integer().min(0).required(),
  attack: Joi.number().integer().min(0).required(),
  attackType: Joi.string().valid('physical', 'chemical', 'energy').required(),
  resistanceType: Joi.string().valid('physical', 'chemical', 'energy').required(),
  rarity: Joi.string().valid('common', 'uncommon', 'rare', 'epic', 'legendary').required(),
  mutationRate: Joi.number().min(0).max(1).required(),
  abilities: Joi.array().items(Joi.string()).optional()
});

/**
 * Valide les données du pathogène.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validatePathogen = (data) => pathogenSchema.validate(data, { abortEarly: false });

/**
 * Convertit un pathogène Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Pathogène formaté.
 */
const fromFirestore = (doc) => ({
  id: doc.id,
  type: doc.type || 'virus',
  name: doc.name,
  health: doc.health || 0,
  attack: doc.attack || 0,
  attackType: doc.attackType || 'physical',
  resistanceType: doc.resistanceType || 'physical',
  rarity: doc.rarity || 'common',
  mutationRate: doc.mutationRate || 0,
  abilities: doc.abilities || []
});

/**
 * Convertit un pathogène API en format Firestore.
 * @param {Object} pathogen - Pathogène API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (pathogen) => ({
  id: pathogen.id,
  type: pathogen.type,
  name: pathogen.name,
  health: pathogen.health,
  attack: pathogen.attack,
  attackType: pathogen.attackType,
  resistanceType: pathogen.resistanceType,
  rarity: pathogen.rarity,
  mutationRate: pathogen.mutationRate,
  abilities: pathogen.abilities
});

module.exports = {
  pathogenSchema,
  validatePathogen,
  fromFirestore,
  toFirestore
};