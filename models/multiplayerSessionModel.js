const Joi = require('joi');

/**
 * Schéma pour une session multijoueur dans Firestore et les réponses API.
 * @typedef {Object} MultiplayerSession
 * @property {string} sessionId - Identifiant unique.
 * @property {string[]} playerIds - IDs des joueurs.
 * @property {string} status - État (pending, active, finished).
 * @property {string} createdAt - Date de création (ISO 8601).
 * @property {Object} [gameState] - État du jeu.
 */
const multiplayerSessionSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  playerIds: Joi.array().items(Joi.string().uuid()).required(),
  status: Joi.string().valid('pending', 'active', 'finished').required(),
  createdAt: Joi.string().isoDate().required(),
  gameState: Joi.object().optional()
});

/**
 * Valide les données de la session multijoueur.
 * @param {Object} data - Données à valider.
 * @returns {Object} Résultat de la validation Joi.
 */
const validateMultiplayerSession = (data) => multiplayerSessionSchema.validate(data, { abortEarly: false });

/**
 * Convertit une session Firestore en format API.
 * @param {Object} doc - Document Firestore.
 * @returns {Object} Session formatée.
 */
const fromFirestore = (doc) => ({
  sessionId: doc.sessionId,
  playerIds: doc.playerIds || [],
  status: doc.status,
  createdAt: doc.createdAt,
  gameState: doc.gameState || {}
});

/**
 * Convertit une session API en format Firestore.
 * @param {Object} session - Session API.
 * @returns {Object} Données Firestore.
 */
const toFirestore = (session) => ({
  sessionId: session.sessionId,
  playerIds: session.playerIds,
  status: session.status,
  createdAt: session.createdAt,
  gameState: session.gameState
});

module.exports = {
  multiplayerSessionSchema,
  validateMultiplayerSession,
  fromFirestore,
  toFirestore
};