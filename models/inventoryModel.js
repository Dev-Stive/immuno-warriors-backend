const Joi = require('joi');

/**
 * Schéma pour un élément d'inventaire dans Firestore et les réponses API.
 * @typedef {Object} InventoryItem
 * @property {string} id - Identifiant unique (UUID).
 * @property {string} type - Type d'élément (ex. resource, equipment).
 * @property {string} name - Nom de l'élément.
 * @property {number} quantity - Quantité (entier ≥ 0).
 * @property {Object} [properties] - Propriétés supplémentaires.
 */
const inventorySchema = Joi.object({
  id: Joi.string().uuid().required(),
  type: Joi.string().required(),
  name: Joi.string().required(),
  quantity: Joi.number().integer().min(0).required(),
  properties: Joi.object().optional()
});

/**
 * Schéma pour les mises à jour d'un élément d'inventaire.
 * @typedef {Object} InventoryUpdate
 * @property {string} [name] - Nouveau nom de l'élément.
 * @property {number} [quantity] - Nouvelle quantité.
 */
const updateSchema = Joi.object({
  name: Joi.string().optional(),
  quantity: Joi.number().integer().min(0).optional()
}).min(1); // Au moins un champ requis

/**
 * Valide les données d'inventaire.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateInventoryItem = (data) => inventorySchema.validate(data, { abortEarly: false });

/**
 * Valide les données de mise à jour d'inventaire.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateInventoryUpdate = (data) => updateSchema.validate(data, { abortEarly: false });

/**
 * Convertit un élément Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Élément formaté.
 */
const fromFirestore = (doc) => ({
  id: doc.id,
  type: doc.type,
  name: doc.name,
  quantity: doc.quantity,
  properties: doc.properties || {}
});

/**
 * Convertit un élément API en format Firestore.
 * @param {Object} item - Élément API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (item) => ({
  id: item.id,
  type: item.type,
  name: item.name,
  quantity: item.quantity,
  properties: item.properties || {}
});

module.exports = {
  inventorySchema,
  updateSchema,
  validateInventoryItem,
  validateInventoryUpdate,
  fromFirestore,
  toFirestore
};
