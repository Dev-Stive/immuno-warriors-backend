const { v4: uuidv4 } = require('uuid');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const MultiplayerRepository = require('../repositories/multiplayerRepository');
const UserRepository = require('../repositories/userRepository');
const { formatTimestamp } = require('../utils/dateUtils');

class MultiplayerService {
  async createSession(userId, sessionData) {
    try {
      if (!userId || !sessionData) throw new AppError(400, 'Données invalides');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const session = {
        sessionId: uuidv4(),
        playerIds: [userId],
        status: 'pending',
        createdAt: formatTimestamp(),
        gameState: sessionData.gameState || {},
        maxPlayers: sessionData.maxPlayers,
      };
      await MultiplayerRepository.createMultiplayerSession(session);
      await MultiplayerRepository.cacheMultiplayerSession(session.sessionId, session);
      logger.info(`Session multijoueur ${session.sessionId} créée par l'utilisateur ${userId}`);
      return session;
    } catch (error) {
      logger.error('Erreur lors de la création de la session multijoueur', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création de la session');
    }
  }

  async joinSession(userId, sessionId) {
    try {
      if (!userId || !sessionId) throw new AppError(400, 'Données invalides');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const session = await MultiplayerRepository.getMultiplayerSession(sessionId);
      if (!session) throw new NotFoundError('Session multijoueur non trouvée');
      if (session.status !== 'pending') throw new AppError(400, 'Session non ouverte');
      if (session.playerIds.includes(userId)) throw new AppError(400, 'Utilisateur déjà dans la session');

      await MultiplayerRepository.updateMultiplayerSession(sessionId, {
        playerIds: [...session.playerIds, userId],
        status: session.playerIds.length + 1 >= session.maxPlayers ? 'active' : 'pending',
      });
      const updatedSession = await MultiplayerRepository.getMultiplayerSession(sessionId);
      await MultiplayerRepository.cacheMultiplayerSession(sessionId, updatedSession);
      logger.info(`Utilisateur ${userId} a rejoint la session ${sessionId}`);
      return updatedSession;
    } catch (error) {
      logger.error('Erreur lors de la jointure de la session multijoueur', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la jointure de la session');
    }
  }

  async getSessionStatus(sessionId) {
    try {
      if (!sessionId) throw new AppError(400, 'ID de session invalide');
      const session = (await MultiplayerRepository.getCachedMultiplayerSession(sessionId)) ||
        await MultiplayerRepository.getMultiplayerSession(sessionId);
      if (!session) throw new NotFoundError('Session multijoueur non trouvée');
      logger.info(`Statut de la session ${sessionId} récupéré`);
      return session;
    } catch (error) {
      logger.error('Erreur lors de la récupération du statut de la session', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du statut');
    }
  }

  async getUserSessions(userId, page = 1, limit = 10) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const snapshot = await MultiplayerRepository.collection
        .where('playerIds', 'array-contains', userId)
        .where('deleted', '==', false)
        .orderBy('createdAt', 'desc')
        .offset((page - 1) * limit)
        .limit(limit)
        .get();
      const total = (await MultiplayerRepository.collection
        .where('playerIds', 'array-contains', userId)
        .where('deleted', '==', false)
        .count()
        .get()).size;
      const sessions = snapshot.docs.map(doc => fromFirestore(doc.data()));
      logger.info(`Sessions multijoueurs récupérées pour l'utilisateur ${userId}`);
      return { data: sessions, total };
    } catch (error) {
      logger.error('Erreur lors de la récupération des sessions de l\'utilisateur', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des sessions');
    }
  }
}

module.exports = new MultiplayerService();