const Joi = require('joi');

/**
 * Schéma pour un rapport de combat dans Firestore et les réponses API.
 * @typedef {Object} CombatReport
 * @property {string} combatId - Identifiant du combat.
 * @property {string} date - Date du combat (ISO 8601).
 * @property {string} result - Résultat (victory, defeat, draw).
 * @property {string[]} log - Journal des événements.
 * @property {number} damageDealt - Dégâts infligés.
 * @property {number} damageTaken - Dégâts reçus.
 * @property {string[]} unitsDeployed - Unités déployées (IDs).
 * @property {string[]} unitsLost - Unités perdues (IDs).
 * @property {string} baseId - ID de la base virale.
 * @property {Object[]} [antibodiesUsed] - Anticorps utilisés.
 * @property {Object} [pathogenFought] - Pathogène combattu.
 */
const combatReportSchema = Joi.object({
  combatId: Joi.string().uuid().required(),
  date: Joi.string().isoDate().required(),
  result: Joi.string().valid('victory', 'defeat', 'draw').required(),
  log: Joi.array().items(Joi.string()).required(),
  damageDealt: Joi.number().integer().min(0).required(),
  damageTaken: Joi.number().integer().min(0).required(),
  unitsDeployed: Joi.array().items(Joi.string().uuid()).required(),
  unitsLost: Joi.array().items(Joi.string().uuid()).required(),
  baseId: Joi.string().uuid().required(),
  antibodiesUsed: Joi.array().items(Joi.object()).optional(),
  pathogenFought: Joi.object().optional()
});

/**
 * Valide les données du rapport de combat.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateCombatReport = (data) => combatReportSchema.validate(data, { abortEarly: false });

/**
 * Convertit un rapport Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Rapport formaté.
 */
const fromFirestore = (doc) => ({
  combatId: doc.combatId,
  date: doc.date,
  result: doc.result,
  log: doc.log || [],
  damageDealt: doc.damageDealt,
  damageTaken: doc.damageTaken,
  unitsDeployed: doc.unitsDeployed || [],
  unitsLost: doc.unitsLost || [],
  baseId: doc.baseId,
  antibodiesUsed: doc.antibodiesUsed || null,
  pathogenFought: doc.pathogenFought || null
});

/**
 * Convertit un rapport API en format Firestore.
 * @param {Object} report - Rapport API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (report) => ({
  combatId: report.combatId,
  date: report.date,
  result: report.result,
  log: report.log,
  damageDealt: report.damageDealt,
  damageTaken: report.damageTaken,
  unitsDeployed: report.unitsDeployed,
  unitsLost: report.unitsLost,
  baseId: report.baseId,
  antibodiesUsed: report.antibodiesUsed,
  pathogenFought: report.pathogenFought
});

module.exports = {
  combatReportSchema,
  validateCombatReport,
  fromFirestore,
  toFirestore
};
