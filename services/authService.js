const { auth } = require('../services/firebaseService');
const { AppError, UnauthorizedError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const UserRepository = require('../repositories/userRepository');

class AuthService {
  /**
   * Inscrit un nouvel utilisateur après validation du token Firebase.
   * @param {Object} userData - Données d'inscription (email, username, firebaseToken).
   * @returns {Promise<Object>} - Utilisateur et token serveur.
   */
  async signUp(userData) {
    const { email, username, firebaseToken } = userData;
    try {
      // Vérifier le token Firebase
      const decodedToken = await auth.verifyIdToken(firebaseToken, true);
      const userId = decodedToken.uid;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await UserRepository.getCurrentUser(userId);
      if (existingUser) {
        throw new AppError(409, 'Utilisateur déjà inscrit');
      }

      // Créer le profil utilisateur
      const userProfile = {
        id: userId,
        email,
        username,
        avatar: '/home/stive-junior/immuno_warriors/assets/animations/avatar.json',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        resources: { credits: 100, energy: 50 },
        progression: { level: 1, xp: 0 },
        achievements: {},
        inventory: [],
        settings: {},
      };

      await UserRepository.saveUser(userProfile);
      const serverToken = await auth.createCustomToken(userId);
      await UserRepository.cacheCurrentUser(userId, userProfile);

      logger.info(`Utilisateur ${userId} inscrit avec succès`);
      return { user: userProfile, token: serverToken };
    } catch (error) {
      logger.error('Erreur lors de l\'inscription', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'inscription');
    }
  }

  /**
   * Connecte un utilisateur après validation du token Firebase.
   * @param {Object} credentials - Identifiants (email, firebaseToken).
   * @returns {Promise<Object>} - Utilisateur et token serveur.
   */
  async signIn(credentials) {
    const { email, firebaseToken } = credentials;
    try {
      // Vérifier le token Firebase
      const decodedToken = await auth.verifyIdToken(firebaseToken, true);
      const userId = decodedToken.uid;

      // Récupérer l'utilisateur
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Profil utilisateur non trouvé');

      user.lastLogin = new Date().toISOString();
      await UserRepository.saveUser(user);

      const serverToken = await auth.createCustomToken(userId);
      await UserRepository.cacheCurrentUser(userId, user);

      logger.info(`Utilisateur ${userId} connecté avec succès`);
      return { user, token: serverToken };
    } catch (error) {
      logger.error('Erreur lors de la connexion', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la connexion');
    }
  }

  /**
   * Rafraîchit le token serveur à partir d'un token Firebase.
   * @param {string} firebaseToken - Token Firebase.
   * @returns {Promise<Object>} - Nouveau token serveur et userId.
   */
  async refreshToken(firebaseToken) {
    try {
      const decodedToken = await auth.verifyIdToken(firebaseToken, true);
      const userId = decodedToken.uid;

      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const serverToken = await auth.createCustomToken(userId);
      await UserRepository.cacheCurrentUser(userId, user);

      logger.info(`Token rafraîchi pour l'utilisateur ${userId}`);
      return { userId, token: serverToken };
    } catch (error) {
      logger.error('Erreur lors du rafraîchissement du token', { error });
      throw error instanceof AppError ? error : new AppError(401, 'Token Firebase invalide');
    }
  }

  /**
   * Déconnecte l'utilisateur en supprimant sa session.
   * @param {string} token - Token serveur.
   * @returns {Promise<void>}
   */
  async signOut(token) {
    try {
      const decodedToken = await auth.verifyIdToken(token, true);
      const userId = decodedToken.uid;
      await UserRepository.clearCachedSession(userId);
      logger.info(`Utilisateur ${userId} déconnecté avec succès`);
    } catch (error) {
      logger.error('Erreur lors de la déconnexion', { error });
      throw new AppError(500, 'Erreur serveur lors de la déconnexion');
    }
  }

  /**
   * Vérifie la validité d'un token serveur.
   * @param {string} token - Token serveur.
   * @returns {Promise<Object>} - Informations de l'utilisateur.
   */
  async verifyToken(token) {
    try {
      const decodedToken = await auth.verifyIdToken(token, true);
      const userId = decodedToken.uid;
      const isValid = await UserRepository.isSessionValid(userId);
      if (!isValid) throw new UnauthorizedError('Session invalide');
      logger.info(`Token vérifié pour l'utilisateur ${userId}`);
      return { userId };
    } catch (error) {
      logger.error('Erreur lors de la vérification du token', { error });
      throw error.code === 'auth/id-token-revoked'
        ? new UnauthorizedError('Token révoqué')
        : new AppError(401, 'Token invalide');
    }
  }
}

module.exports = new AuthService();

