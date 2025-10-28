const Joi = require('joi');

/**
 * Schéma pour une signature mémoire dans Firestore et les réponses API.
 * @typedef {Object} MemorySignature
 * @property {string} pathogenType - Type de pathogène (virus, bacteria, fungus).
 * @property {number} attackBonus - Bonus d'attaque (entier ≥ 0).
 * @property {number} defenseBonus - Bonus de défense (entier ≥ 0).
 * @property {string} expiryDate - Date d'expiration (ISO 8601).
 */
const memorySignatureSchema = Joi.object({
  pathogenType: Joi.string().valid('virus', 'bacteria', 'fungus').required(),
  attackBonus: Joi.number().integer().min(0).required(),
  defenseBonus: Joi.number().integer().min(0).required(),
  expiryDate: Joi.string().isoDate().required()
});

/**
 * Valide les données de la signature mémoire.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateMemorySignature = (data) => memorySignatureSchema.validate(data, { abortEarly: false });

/**
 * Convertit une signature Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Signature formatée.
 */
const fromFirestore = (doc) => ({
  pathogenType: doc.pathogenType,
  attackBonus: doc.attackBonus,
  defenseBonus: doc.defenseBonus,
  expiryDate: doc.expiryDate
});

/**
 * Convertit une signature API en format Firestore.
 * @param {Object} signature - Signature API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (signature) => ({
  pathogenType: signature.pathogenType,
  attackBonus: signature.attackBonus,
  defenseBonus: signature.defenseBonus,
  expiryDate: signature.expiryDate
});

module.exports = {
  memorySignatureSchema,
  validateMemorySignature,
  fromFirestore,
  toFirestore
};
