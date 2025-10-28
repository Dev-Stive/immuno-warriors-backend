const Joi = require('joi');

/**
 * Schéma pour un anticorps dans Firestore et les réponses API.
 * @typedef {Object} Antibody
 * @property {string} id - Identifiant unique.
 * @property {string} type - Type (igG, igM, igA, igD, igE).
 * @property {string} attackType - Type d'attaque (physical, chemical, energy).
 * @property {number} damage - Dégâts de base.
 * @property {number} range - Portée.
 * @property {number} cost - Coût de déploiement.
 * @property {number} efficiency - Efficacité (0 à 1).
 * @property {string} name - Nom de l'anticorps.
 * @property {number} health - Points de vie actuels.
 * @property {number} maxHealth - Points de vie maximum.
 * @property {string} [specialAbility] - Capacité spéciale (optionnelle).
 */
const antibodySchema = Joi.object({
  id: Joi.string().uuid().required(),
  type: Joi.string().valid('igG', 'igM', 'igA', 'igD', 'igE').required(),
  attackType: Joi.string().valid('physical', 'chemical', 'energy').required(),
  damage: Joi.number().integer().min(0).required(),
  range: Joi.number().integer().min(0).required(),
  cost: Joi.number().integer().min(0).required(),
  efficiency: Joi.number().min(0).max(1).required(),
  name: Joi.string().required(),
  health: Joi.number().integer().min(0).required(),
  maxHealth: Joi.number().integer().min(0).required(),
  specialAbility: Joi.string().optional()
});

/**
 * Valide les données de l'anticorps.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateAntibody = (data) => antibodySchema.validate(data, { abortEarly: false });

/**
 * Convertit un anticorps Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Anticorps formaté.
 */
const fromFirestore = (doc) => ({
  id: doc.id,
  type: doc.type || 'igG',
  attackType: doc.attackType || 'physical',
  damage: doc.damage || 0,
  range: doc.range || 0,
  cost: doc.cost || 0,
  efficiency: doc.efficiency || 0,
  name: doc.name,
  health: doc.health || 0,
  maxHealth: doc.maxHealth || 0,
  specialAbility: doc.specialAbility || null
});

/**
 * Convertit un anticorps API en format Firestore.
 * @param {Object} antibody - Anticorps API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (antibody) => ({
  id: antibody.id,
  type: antibody.type,
  attackType: antibody.attackType,
  damage: antibody.damage,
  range: antibody.range,
  cost: antibody.cost,
  efficiency: antibody.efficiency,
  name: antibody.name,
  health: antibody.health,
  maxHealth: antibody.maxHealth,
  specialAbility: antibody.specialAbility
});

module.exports = {
  antibodySchema,
  validateAntibody,
  fromFirestore,
  toFirestore
};