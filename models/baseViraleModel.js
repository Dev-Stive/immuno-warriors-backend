const Joi = require('joi');

/**
 * Schéma pour une base virale dans Firestore et les réponses API.
 * @typedef {Object} BaseVirale
 * @property {string} id - Identifiant unique.
 * @property {string} playerId - ID du joueur.
 * @property {string} name - Nom de la base.
 * @property {number} level - Niveau de la base.
 * @property {Object[]} pathogens - Liste des pathogènes.
 * @property {Object} defenses - Défenses (ex. { wall: 50, trap: 20 }).
 */
const baseViraleSchema = Joi.object({
  id: Joi.string().uuid().required(),
  playerId: Joi.string().uuid().required(),
  name: Joi.string().required(),
  level: Joi.number().integer().min(1).required(),
  pathogens: Joi.array().items(Joi.object()).required(),
  defenses: Joi.object().pattern(
    Joi.string().valid('wall', 'trap', 'shield', 'turret'),
    Joi.number().integer().min(0)
  ).required()
});

/**
 * Valide les données de la base virale.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateBaseVirale = (data) => baseViraleSchema.validate(data, { abortEarly: false });

/**
 * Convertit une base Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Base formatée.
 */
const fromFirestore = (doc) => ({
  id: doc.id,
  playerId: doc.playerId,
  name: doc.name,
  level: doc.level || 1,
  pathogens: doc.pathogens || [],
  defenses: doc.defenses || { wall: 0, trap: 0, shield: 0, turret: 0 }
});

/**
 * Convertit une base API en format Firestore.
 * @param {Object} base - Base API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (base) => ({
  id: base.id,
  playerId: base.playerId,
  name: base.name,
  level: base.level,
  pathogens: base.pathogens,
  defenses: base.defenses
});

module.exports = {
  baseViraleSchema,
  validateBaseVirale,
  fromFirestore,
  toFirestore
};
