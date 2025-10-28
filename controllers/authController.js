const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const AuthService = require('../services/authService');

const signUpSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).required(),
  firebaseToken: Joi.string().required(),
});

const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  firebaseToken: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  firebaseToken: Joi.string().required(),
});

class AuthController {
  async signUp(req, res) {
    const { email, username, firebaseToken } = req.body;
    try {
      const result = await AuthService.signUp({ email, username, firebaseToken });
      res.status(201).json(result);
    } catch (error) {
      throw error;
    }
  }

  async signIn(req, res) {
    const { email, firebaseToken } = req.body;
    try {
      const result = await AuthService.signIn({ email, firebaseToken });
      res.status(200).json(result);
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(req, res) {const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const AuthService = require('../services/authService');

const signUpSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  username: Joi.string().min(3).max(30).required(),
});

const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

class AuthController {
  /**
   * Inscrit un nouvel utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON avec utilisateur et token.
   */
  async signUp(req, res) {
    const { email, password, username } = req.body;
    try {
      const { user, token } = await AuthService.signUp({ email, password, username });
      res.status(201).json({ user, token });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Connecte un utilisateur existant.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON avec utilisateur et token.
   */
  async signIn(req, res) {
    const { email, password } = req.body;
    try {
      const { user, token } = await AuthService.signIn({ email, password });
      res.status(200).json({ user, token });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Déconnecte l'utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON confirmant la déconnexion.
   */
  async signOut(req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    try {
      await AuthService.signOut(token);
      res.status(200).json({ message: 'Déconnexion réussie' });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Vérifie la validité d'un token.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @returns {Promise<void>} - Réponse JSON avec résultat.
   */
  async verifyToken(req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    try {
      const result = await AuthService.verifyToken(token);
      res.status(200).json(result);
    } catch (error) {
      throw error;
    }
  }
}

const controller = new AuthController();
module.exports = {
  signUp: [validate(signUpSchema), controller.signUp.bind(controller)],
  signIn: [validate(signInSchema), controller.signIn.bind(controller)],
  signOut: controller.signOut.bind(controller),
  verifyToken: controller.verifyToken.bind(controller),
};

    const { firebaseToken } = req.body;
    try {
      const result = await AuthService.refreshToken(firebaseToken);
      res.status(200).json(result);
    } catch (error) {
      throw error;
    }
  }

  async signOut(req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    try {
      await AuthService.signOut(token);
      res.status(200).json({ message: 'Déconnexion réussie' });
    } catch (error) {
      throw error;
    }
  }

  async verifyToken(req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    try {
      const result = await AuthService.verifyToken(token);
      res.status(200).json(result);
    } catch (error) {
      throw error;
    }
  }
}

const controller = new AuthController();
module.exports = {
  signUp: [validate(signUpSchema), controller.signUp.bind(controller)],
  signIn: [validate(signInSchema), controller.signIn.bind(controller)],
  refreshToken: [validate(refreshTokenSchema), controller.refreshToken.bind(controller)],
  signOut: controller.signOut.bind(controller),
  verifyToken: controller.verifyToken.bind(controller),
};
