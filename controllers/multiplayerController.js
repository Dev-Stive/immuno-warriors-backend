
const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const MultiplayerService = require('../services/multiplayerService');
const { AppError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');


const createSessionSchema = Joi.object({
  gameState: Joi.object().optional(),
  maxPlayers: Joi.number().integer().min(2).max(10).required(),
});

const joinSessionSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
});

const getSessionStatusSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
});

const getUserSessionsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(10).default(10),
});

class MultiplayerController {
  async createSession(req, res, next) {
    try {
      const { userId } = req.user;
      const sessionData = req.body;
      const session = await MultiplayerService.createSession(userId, sessionData);
      res.status(201).json({ status: 'success', data: session });
    } catch (error) {
      logger.error('Erreur dans createSession', { error });
      next(error);
    }
  }

  async joinSession(req, res, next) {
    try {
      const { userId } = req.user;
      const { sessionId } = req.params;
      const session = await MultiplayerService.joinSession(userId, sessionId);
      res.status(200).json({ status: 'success', data: session });
    } catch (error) {
      logger.error('Erreur dans joinSession', { error });
      next(error);
    }
  }

  async getSessionStatus(req, res, next) {
    try {
      const { sessionId } = req.params;
      const session = await MultiplayerService.getSessionStatus(sessionId);
      res.status(200).json({ status: 'success', data: session });
    } catch (error) {
      logger.error('Erreur dans getSessionStatus', { error });
      next(error);
    }
  }

  async getUserSessions(req, res, next) {
    try {
      const { userId } = req.user;
      const { page, limit } = req.query;
      const { data, total } = await MultiplayerService.getUserSessions(userId, parseInt(page), parseInt(limit));
      res.status(200).json({
        status: 'success',
        data,
        meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      logger.error('Erreur dans getUserSessions', { error });
      next(error);
    }
  }
}

const controller = new MultiplayerController();
module.exports = {
  createSession: [validate(createSessionSchema), controller.createSession.bind(controller)],
  joinSession: [validate(joinSessionSchema), controller.joinSession.bind(controller)],
  getSessionStatus: [validate(getSessionStatusSchema), controller.getSessionStatus.bind(controller)],
  getUserSessions: [validate(getUserSessionsSchema), controller.getUserSessions.bind(controller)],
  createSessionSchema,
  joinSessionSchema,
  getSessionStatusSchema,
  getUserSessionsSchema,
};
