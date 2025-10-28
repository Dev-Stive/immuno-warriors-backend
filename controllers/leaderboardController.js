const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const LeaderboardService = require('../services/leaderboardService');
const { logger } = require('../utils/logger');

const updateScoreSchema = Joi.object({
  category: Joi.string().valid('combat', 'research', 'resources').required(),
  score: Joi.number().integer().min(0).required(),
});

const getLeaderboardSchema = Joi.object({
  category: Joi.string().valid('combat', 'research', 'resources').required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

const getUserRankSchema = Joi.object({
  category: Joi.string().valid('combat', 'research', 'resources').required(),
});

class LeaderboardController {
  async updateScore(req, res, next) {
    try {
      const { userId } = req.user;
      const { category, score } = req.body;
      await LeaderboardService.updateScore(userId, category, score);
      res.status(200).json({
        status: 'success',
        data: { message: 'Score mis à jour' },
      });
    } catch (error) {
      logger.error('Erreur dans updateScore', { error });
      next(error);
    }
  }

  async getLeaderboard(req, res, next) {
    try {
      const { category } = req.params;
      const { page, limit } = req.query;
      const leaderboard = await LeaderboardService.getLeaderboard(category, parseInt(page) || 1, parseInt(limit) || 10);
      res.status(200).json({
        status: 'success',
        data: leaderboard,
      });
    } catch (error) {
      logger.error('Erreur dans getLeaderboard', { error });
      next(error);
    }
  }

  async getUserRank(req, res, next) {
    try {
      const { userId } = req.user;
      const { category } = req.params;
      const rankInfo = await LeaderboardService.getUserRank(userId, category);
      res.status(200).json({
        status: 'success',
        data: rankInfo,
      });
    } catch (error) {
      logger.error('Erreur dans getUserRank', { error });
      next(error);
    }
  }
}

const controller = new LeaderboardController();
module.exports = {
  updateScore: [validate(updateScoreSchema), controller.updateScore],
  getLeaderboard: [validate(getLeaderboardSchema), controller.getLeaderboard],
  getUserRank: [validate(getUserRankSchema), controller.getUserRank],
  updateScoreSchema,
  getLeaderboardSchema,
  getUserRankSchema,
};
