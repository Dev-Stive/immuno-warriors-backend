const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../services/firebaseService');
const config = require('../config');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { formatTimestamp } = require('../utils/dateUtils');
const CombatRepository = require('../repositories/combatRepository');
const UserRepository = require('../repositories/userRepository');
const ResearchRepository = require('../repositories/researchRepository');
const BaseViraleRepository = require('../repositories/baseViraleRepository');

if (!config.geminiApiKey) {
  logger.error('Clé API Gemini (GEMINI_API_KEY) non configurée dans .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

class GeminiService {
  constructor() {
    this.responseCollection = db.collection('geminiResponses');
  }

  async generateCombatChronicle(combatId) {
    try {
      if (!combatId) throw new AppError(400, 'ID de combat invalide');
      const combat = await CombatRepository.getCombatReport(combatId);
      if (!combat) throw new NotFoundError('Combat non trouvé');

      const prompt = `Génère une chronique narrative immersive pour un combat dans le jeu Immuno Warriors. Voici les détails :
      - Combat ID : ${combat.combatId}
      - Date : ${combat.date}
      - Base ID : ${combat.baseId}
      - Pathogènes : ${JSON.stringify(combat.pathogenFought || [], null, 2)}
      - Anticorps : ${JSON.stringify(combat.antibodiesUsed || [], null, 2)}
      - Journal : ${JSON.stringify(combat.log || [], null, 2)}
      - Résultat : ${combat.result}
      Raconte l'histoire comme une bataille épique entre des pathogènes envahissants et des anticorps défendant le corps humain, avec un style narratif captivant. Limite la réponse à 500 mots.`;

      const chronicle = await this._generateContent(prompt);
      const response = {
        id: uuidv4(),
        type: 'combat_chronicle',
        content: { text: chronicle },
        timestamp: formatTimestamp(),
      };
      await this._storeResponse(response);
      logger.info(`Chronique générée pour le combat ${combatId}`);
      return response;
    } catch (error) {
      logger.error('Erreur lors de la génération de la chronique de combat', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la génération de la chronique');
    }
  }

  async getTacticalAdvice(combatId) {
    try {
      if (!combatId) throw new AppError(400, 'ID de combat invalide');
      const combat = await CombatRepository.getCombatReport(combatId);
      if (!combat) throw new NotFoundError('Combat non trouvé');

      const prompt = `Analyse les données suivantes d'un combat dans Immuno Warriors et fournis 3 à 5 conseils tactiques spécifiques pour améliorer les performances futures :
      - Pathogènes : ${JSON.stringify(combat.pathogenFought || [], null, 2)}
      - Anticorps : ${JSON.stringify(combat.antibodiesUsed || [], null, 2)}
      - Journal : ${JSON.stringify(combat.log || [], null, 2)}
      - Résultat : ${combat.result}
      Les conseils doivent être précis, en lien avec les statistiques (attaque, santé, etc.) et adaptés au contexte du jeu. Formatte la réponse comme une liste à puces.`;

      const adviceText = await this._generateContent(prompt);
      const advice = adviceText
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
        .map(line => line.trim().replace(/^[-*]\s*/, ''));
      const response = {
        id: uuidv4(),
        type: 'tactical_advice',
        content: { advice },
        timestamp: formatTimestamp(),
      };
      await this._storeResponse(response);
      logger.info(`Conseils tactiques générés pour le combat ${combatId}`);
      return response;
    } catch (error) {
      logger.error('Erreur lors de la génération des conseils tactiques', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la génération des conseils tactiques');
    }
  }

  async generateResearchDescription(researchId) {
    try {
      if (!researchId) throw new AppError(400, 'ID de recherche invalide');
      const research = await ResearchRepository.getCachedResearchItem(researchId) ||
        await ResearchRepository.getResearchItem(researchId);
      if (!research) throw new NotFoundError('Recherche non trouvée');

      const prompt = `Crée une description narrative immersive pour une recherche scientifique dans Immuno Warriors. Voici les détails :
      - ID : ${research.id}
      - Nom : ${research.name || 'Recherche sans nom'}
      - Description : ${research.description || 'Aucune description'}
      - Progression : ${JSON.stringify(research.progression || {}, null, 2)}
      La description doit capturer l'importance de cette recherche dans la lutte contre les pathogènes, avec un ton scientifique mais engageant. Limite la réponse à 300 mots.`;

      const description = await this._generateContent(prompt);
      const response = {
        id: uuidv4(),
        type: 'research_description',
        content: { text: description },
        timestamp: formatTimestamp(),
      };
      await this._storeResponse(response);
      logger.info(`Description générée pour la recherche ${researchId}`);
      return response;
    } catch (error) {
      logger.error('Erreur lors de la génération de la description de recherche', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la génération de la description de recherche');
    }
  }

  async generateBaseDescription(baseId) {
    try {
      if (!baseId) throw new AppError(400, 'ID de base virale invalide');
      const base = await BaseViraleRepository.getCachedBaseDetails(baseId) ||
        await BaseViraleRepository.getBaseViraleById(baseId);
      if (!base) throw new NotFoundError('Base virale non trouvée');

      const prompt = `Crée une description narrative immersive pour une base virale dans le jeu Immuno Warriors. Voici les détails :
      - ID : ${base.id}
      - Nom : ${base.name || 'Base sans nom'}
      - Niveau : ${base.level || 1}
      - Pathogènes : ${JSON.stringify(base.pathogens || [], null, 2)}
      - Défenses : ${JSON.stringify(base.defenses || [], null, 2)}
      Décris la base comme un bastion stratégique des pathogènes, avec un ton menaçant mais captivant. Limite la réponse à 300 mots.`;

      const description = await this._generateContent(prompt);
      const response = {
        id: uuidv4(),
        type: 'base_description',
        content: { text: description },
        timestamp: formatTimestamp(),
      };
      await this._storeResponse(response);
      logger.info(`Description générée pour la base virale ${baseId}`);
      return response;
    } catch (error) {
      logger.error('Erreur lors de la génération de la description de base virale', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la génération de la description de base');
    }
  }

  async chatWithGemini(userId, message) {
    try {
      if (!userId || !message) throw new AppError(400, 'Utilisateur ou message invalide');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const prompt = `Tu es un assistant IA dans le jeu Immuno Warriors, où les joueurs combattent des pathogènes avec des anticorps. Réponds à la requête suivante en te basant sur les données de l'utilisateur et le contexte du jeu :
      - Utilisateur : ${JSON.stringify({ id: user.id, userResources: user.resources, userProgression: user.progression }, null, 2)}
      - Message : ${message}
      Fournis une réponse engageante, précise, et adaptée au contexte du jeu. Limite la réponse à 300 mots.`;

      const responseText = await this._generateContent(prompt);
      const response = {
        id: uuidv4(),
        type: 'chat',
        content: { text: responseText },
        timestamp: formatTimestamp(),
      };
      await this._storeResponse(response);
      logger.info(`Réponse Gemini générée pour l'utilisateur ${userId}`);
      return response;
    } catch (error) {
      logger.error('Erreur lors de la conversation avec Gemini', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la conversation avec Gemini');
    }
  }

  async getStoredResponses(userId, type) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      let query = this.responseCollection.where('deleted', '==', null);
      
      if (type) query = query.where('type', '==', type);

      const snapshot = await query.orderBy('timestamp', 'desc').limit(50).get();
      const responses = snapshot.docs.map(doc => ({
        id: doc.data().id,
        type: doc.data().type,
        content: doc.data().content,
        timestamp: doc.data().timestamp,
      }));
      logger.info(`Réponses Gemini récupérées pour userId=${userId}, type=${type || 'tous'}`);
      return responses;
    } catch (error) {
      logger.error('Erreur lors de la récupération des réponses stockées', { error });
      throw new AppError(500, 'Erreur serveur lors de la récupération des réponses stockées');
    }
  }

  /**
   * Génère du contenu avec Gemini.
   * @param {string} prompt - Prompt à envoyer.
   * @returns {Promise<string>} Texte généré.
   */
  async _generateContent(prompt) {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = await response.text();
      if (!text) throw new AppError(500, 'Réponse vide de Gemini');
      return text;
    } catch (error) {
      logger.error('Erreur lors de l\'appel à l\'API Gemini', { error });
      throw new AppError(500, 'Échec de la génération de contenu par Gemini');
    }
  }

  /**
   * Stocke une réponse Gemini dans Firestore.
   * @param {Object} response - Réponse à stocker {id, type, content, timestamp}.
   * @returns {Promise<void>}
   */
  async _storeResponse(response) {
    try {
      const data = {
        id: response.id,
        type: response.type,
        content: response.content,
        timestamp: response.timestamp,
        deleted: null,
      };
      await this.responseCollection.doc(response.id).set(data);
      logger.info(`Réponse Gemini stockée : ${response.id}, type=${response.type}`);
    } catch (error) {
      logger.error('Erreur lors du stockage de la réponse Gemini', { error });
      throw new AppError(500, 'Erreur serveur lors du stockage de la réponse Gemini');
    }
  }
}

module.exports = new GeminiService();
