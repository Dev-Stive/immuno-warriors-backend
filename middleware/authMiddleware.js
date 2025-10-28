const { auth } = require('../services/firebaseService');
const { AppError, UnauthorizedError } = require('../utils/errorUtils');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Tentative d\'accès sans token');
    throw new UnauthorizedError('Aucun token fourni');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token, true);
    req.user = { userId: decodedToken.uid };
    logger.info(`Utilisateur ${req.user.userId} authentifié via middleware`);
    setContext({ userId: req.user?.userId });
    next();
  } catch (error) {
    logger.error('Erreur lors de la vérification du token dans le middleware', { error });
    throw error.code === 'auth/id-token-revoked'
      ? new UnauthorizedError('Token révoqué')
      : new AppError(401, 'Token invalide');
  }
};


module.exports = authenticate;
