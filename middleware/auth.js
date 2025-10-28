const { auth } = require('../services/firebaseService');

/**
 * Middleware pour vérifier le token d'authentification Firebase ID.
 * Attache les informations de l'utilisateur décodées (uid, email, etc.) à `req.user`.
 */
async function verifyToken(req, res, next) {
  // Le token est envoyé dans le header 'Authorization: Bearer <token>'
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès non autorisé: Aucun token fourni ou format invalide.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Erreur lors de la vérification du token Firebase:', error.message);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token expiré. Veuillez vous reconnecter.' });
    }
    return res.status(401).json({ message: 'Accès non autorisé: Token invalide.' });
  }
}

module.exports = { verifyToken };
